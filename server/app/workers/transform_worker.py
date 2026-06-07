"""Transform Worker - Kafka Consumer/Producer for data normalization."""
import json
import argparse
from confluent_kafka import Consumer, Producer
from confluent_kafka.error import KafkaException
from app.config.kafka_config import KAFKA_TOPICS, TRANSFORM_CONSUMER_CONFIG, PRODUCER_CONFIG
from app.etl.transform import Transform

def delivery_report(err, msg):
    """Delivery report callback."""
    if err is not None:
        print(f"Erro na entrega: {err}")

class TransformWorker:
    def __init__(self):
        self.consumer = Consumer(TRANSFORM_CONSUMER_CONFIG)
        self.producer = Producer(PRODUCER_CONFIG)
        self.transformer = Transform()

        self.consumer.subscribe([KAFKA_TOPICS['raw_licitacoes']])
        print(f"[✓] Inscrito no tópico: {KAFKA_TOPICS['raw_licitacoes']}")

    def run(self, timeout_ms: int = 1000):
        """
        Consume from raw.licitacoes, transform, and produce to transformed.licitacoes.
        """
        try:
            processed_count = 0
            error_count = 0

            print("[*] Aguardando mensagens...")

            while True:
                msg = self.consumer.poll(timeout=timeout_ms / 1000)

                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() != -191:  # _PARTITION_EOF
                        print(f"Erro Kafka: {msg.error()}")
                    continue

                try:
                    record = json.loads(msg.value().decode('utf-8'))
                    transformed = self.transformer.transform_record(record)

                    message = json.dumps(transformed, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS['transformed_licitacoes'],
                        value=message.encode('utf-8'),
                        key=transformed.get('numero_controle_pncp', '').encode('utf-8'),
                        callback=delivery_report
                    )

                    self.consumer.commit(asynchronous=True)
                    processed_count += 1

                    if processed_count % 10 == 0:
                        self.producer.flush(timeout=5)
                        print(f"[✓] {processed_count} registros transformados")

                except Exception as e:
                    error_record = {
                        'error': str(e),
                        'original_message': msg.value().decode('utf-8', errors='ignore'),
                        'timestamp': str(msg.timestamp())
                    }
                    error_message = json.dumps(error_record, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS['transformed_licitacoes_dlq'],
                        value=error_message.encode('utf-8'),
                        callback=delivery_report
                    )

                    self.consumer.commit(asynchronous=True)
                    error_count += 1
                    print(f"[✗] Erro ao transformar registro: {e}")

        except KeyboardInterrupt:
            print(f"\n[*] Parado. Processados: {processed_count}, Erros: {error_count}")
        finally:
            self.producer.flush(timeout=10)
            self.consumer.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Transform PNCP data')
    parser.add_argument('--timeout', type=int, default=1000, help='Timeout em ms')

    args = parser.parse_args()

    worker = TransformWorker()
    worker.run(timeout_ms=args.timeout)
