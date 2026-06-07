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
        Persist batch of records to SQLite.
        """
        try:
            success_count = self.loader.batch_upsert_licitacoes(batch)
            if success_count > 0:
                print(f"[✓] {success_count}/{len(batch)} registros persistidos com sucesso")
            return success_count > 0
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
