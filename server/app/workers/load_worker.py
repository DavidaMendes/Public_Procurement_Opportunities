"""Load Worker - Kafka Consumer for data persistence."""
import json
import argparse
from confluent_kafka import Consumer
from confluent_kafka.error import KafkaException
from app.config.kafka_config import KAFKA_TOPICS, LOAD_CONSUMER_CONFIG
from app.etl.load import Load

class LoadWorker:
    def __init__(self):
        self.consumer = Consumer(LOAD_CONSUMER_CONFIG)
        self.loader = Load()

        self.consumer.subscribe([KAFKA_TOPICS['transformed_licitacoes']])
        print(f"[✓] Inscrito no tópico: {KAFKA_TOPICS['transformed_licitacoes']}")

    def run(self, timeout_ms: int = 1000, batch_size: int = 10):
        """
        Consume transformed data and persist to SQLite.
        """
        try:
            processed_count = 0
            error_count = 0
            batch = []

            print("[*] Aguardando mensagens...")

            while True:
                msg = self.consumer.poll(timeout=timeout_ms / 1000)

                if msg is None:
                    if batch:
                        self._persist_batch(batch)
                        processed_count += len(batch)
                        batch = []
                    continue

                if msg.error():
                    if msg.error().code() != -191:  # _PARTITION_EOF
                        print(f"Erro Kafka: {msg.error()}")
                    continue

                try:
                    record = json.loads(msg.value().decode('utf-8'))
                    batch.append(record)

                    if len(batch) >= batch_size:
                        success = self._persist_batch(batch)
                        if success:
                            self.consumer.commit(asynchronous=True)
                            processed_count += len(batch)
                        else:
                            error_count += len(batch)
                        batch = []

                        print(f"[✓] {processed_count} registros persistidos (erros: {error_count})")

                except Exception as e:
                    error_count += 1
                    print(f"[✗] Erro ao processar registro: {e}")

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

            sqlite_res = result['sqlite']
            mongodb_res = result['mongodb']
            total = result['total_records']

            sqlite_total = sqlite_res['inserted'] + sqlite_res['updated']
            mongodb_total = mongodb_res['inserted']

            if result['success']:
                if sqlite_total != mongodb_total:
                    print(f"[✓] {sqlite_total} em SQLite3 (ins: {sqlite_res['inserted']}, upd: {sqlite_res['updated']}) | "
                          f"{mongodb_total} em MongoDB | Total: {total}")
                else:
                    print(f"[✓] {total} licitações salvas em SQLite3 e MongoDB "
                          f"(ins: {sqlite_res['inserted']}, upd: {sqlite_res['updated']})")
            else:
                print(f"[⚠] Parcial - SQLite3: {sqlite_total} (erros: {sqlite_res['errors']}) | "
                      f"MongoDB: {mongodb_total} (erros: {mongodb_res['errors']})")

            return result['success']

        except Exception as e:
            print(f"[✗] Erro ao persistir lote: {e}")
            return False

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Load PNCP data to database')
    parser.add_argument('--timeout', type=int, default=1000, help='Timeout em ms')
    parser.add_argument('--batchSize', type=int, default=10, help='Tamanho do lote')

    args = parser.parse_args()

    worker = LoadWorker()
    worker.run(timeout_ms=args.timeout, batch_size=args.batchSize)
