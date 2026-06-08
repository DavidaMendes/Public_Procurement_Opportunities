"""Load Worker - Kafka Consumer for data persistence."""
import argparse
import json
from typing import Optional

from confluent_kafka import Consumer

from app.etl.load import Load
from app.infrastructure.config import KAFKA_TOPICS, LOAD_CONSUMER_CONFIG


class LoadWorker:
    def __init__(self):
        self.consumer = Consumer(LOAD_CONSUMER_CONFIG)
        self.loader = Load()

        self.consumer.subscribe([KAFKA_TOPICS["transformed_licitacoes"]])
        print(f"[OK] Inscrito no topico: {KAFKA_TOPICS['transformed_licitacoes']}")

    def run(
        self,
        timeout_ms: int = 1000,
        batch_size: int = 10,
        max_idle_polls: Optional[int] = None,
        max_messages: Optional[int] = None,
    ):
        """
        Consume transformed data and persist to SQLite/MongoDB.

        max_idle_polls is useful for orchestrated runs: after upstream workers stop
        producing messages, this worker exits once Kafka stays idle.
        """
        processed_count = 0
        error_count = 0
        idle_polls = 0
        batch = []

        try:
            print("[*] Aguardando mensagens...")

            while True:
                msg = self.consumer.poll(timeout=timeout_ms / 1000)

                if msg is None:
                    idle_polls += 1
                    if batch:
                        success = self._persist_batch(batch)
                        if success:
                            self.consumer.commit(asynchronous=True)
                            processed_count += len(batch)
                        else:
                            error_count += len(batch)
                        batch = []

                    if max_idle_polls and idle_polls >= max_idle_polls:
                        print(f"[*] Encerrando por ociosidade apos {idle_polls} polls sem mensagens.")
                        break
                    continue

                idle_polls = 0

                if msg.error():
                    if msg.error().code() != -191:  # _PARTITION_EOF
                        print(f"Erro Kafka: {msg.error()}")
                    continue

                try:
                    record = json.loads(msg.value().decode("utf-8"))
                    batch.append(record)

                    if len(batch) >= batch_size:
                        success = self._persist_batch(batch)
                        if success:
                            self.consumer.commit(asynchronous=True)
                            processed_count += len(batch)
                        else:
                            error_count += len(batch)
                        batch = []

                        print(f"[OK] {processed_count} registros persistidos (erros: {error_count})")

                    if max_messages and processed_count >= max_messages:
                        print(f"[*] Limite de {max_messages} mensagens persistidas atingido.")
                        break

                except Exception as exc:
                    error_count += 1
                    print(f"[ERRO] Erro ao processar registro: {exc}")

        except KeyboardInterrupt:
            print(f"\n[*] Parado. Processados: {processed_count}, Erros: {error_count}")
        finally:
            if batch:
                self._persist_batch(batch)
            self.consumer.close()

    def _persist_batch(self, batch: list) -> bool:
        """
        Persist batch of records to both SQLite and MongoDB.
        Returns success status and logs detailed results.
        """
        try:
            result = self.loader.batch_persist(batch)

            sqlite_res = result["sqlite"]
            mongodb_res = result["mongodb"]
            total = result["total_records"]

            sqlite_total = sqlite_res["inserted"] + sqlite_res["updated"]
            mongodb_total = mongodb_res["inserted"]

            if result["success"]:
                if sqlite_total != mongodb_total:
                    print(
                        f"[OK] {sqlite_total} em SQLite3 "
                        f"(ins: {sqlite_res['inserted']}, upd: {sqlite_res['updated']}) | "
                        f"{mongodb_total} em MongoDB | Total: {total}"
                    )
                else:
                    print(
                        f"[OK] {total} licitacoes salvas em SQLite3 e MongoDB "
                        f"(ins: {sqlite_res['inserted']}, upd: {sqlite_res['updated']})"
                    )
            else:
                print(
                    f"[AVISO] Parcial - SQLite3: {sqlite_total} "
                    f"(erros: {sqlite_res['errors']}) | MongoDB: {mongodb_total} "
                    f"(erros: {mongodb_res['errors']})"
                )

            return result["success"]

        except Exception as exc:
            print(f"[ERRO] Erro ao persistir lote: {exc}")
            return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load PNCP data to database")
    parser.add_argument("--timeout", type=int, default=1000, help="Timeout em ms")
    parser.add_argument("--batchSize", type=int, default=10, help="Tamanho do lote")
    parser.add_argument(
        "--maxIdlePolls",
        type=int,
        default=None,
        help="Encerra apos N polls sem mensagens (opcional)",
    )
    parser.add_argument(
        "--maxMessages",
        type=int,
        default=None,
        help="Encerra apos processar N mensagens (opcional)",
    )

    args = parser.parse_args()

    worker = LoadWorker()
    worker.run(
        timeout_ms=args.timeout,
        batch_size=args.batchSize,
        max_idle_polls=args.maxIdlePolls,
        max_messages=args.maxMessages,
    )
