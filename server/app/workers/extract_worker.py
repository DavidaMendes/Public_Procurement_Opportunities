"""Extract Worker - Kafka Producer for PNCP data extraction."""
import json
import argparse
from datetime import datetime
from confluent_kafka import Producer
from confluent_kafka.error import KafkaException
from app.config.kafka_config import KAFKA_TOPICS, PRODUCER_CONFIG
from app.etl.extract import Extract
from app.core.settings import RECIFE_PROCUREMENT

def delivery_report(err, msg):
    """Delivery report callback."""
    if err is not None:
        print(f"Erro na entrega da mensagem: {err}")
    else:
        print(f"Mensagem entregue ao tópico {msg.topic()} partição {msg.partition()}")

class ExtractWorker:
    def __init__(self):
        self.producer = Producer(PRODUCER_CONFIG)
        self.extractor = Extract()

    def run(self, params: dict, max_pages: int = None):
        """
        Extract data from PNCP API and publish to Kafka.
        """
        params['extracted_at'] = datetime.utcnow().isoformat() + 'Z'

        try:
            record_count = 0
            error_count = 0

            for record in self.extractor.extract_paginated(params, max_pages):
                try:
                    message = json.dumps(record, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS['raw_licitacoes'],
                        value=message.encode('utf-8'),
                        key=record['payload'].get('numeroControlePNCP', '').encode('utf-8'),
                        callback=delivery_report
                    )

                    record_count += 1

                    if record_count % 10 == 0:
                        self.producer.flush(timeout=5)
                        print(f"[✓] {record_count} registros publicados")

                except Exception as e:
                    error_record = {
                        'error': str(e),
                        'original_record': record,
                        'timestamp': datetime.utcnow().isoformat() + 'Z'
                    }
                    error_message = json.dumps(error_record, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS['raw_licitacoes_dlq'],
                        value=error_message.encode('utf-8'),
                        callback=delivery_report
                    )

                    error_count += 1

            # Final flush
            self.producer.flush(timeout=10)
            print(f"\n[✓] Extração concluída: {record_count} registros, {error_count} erros")

        except Exception as e:
            print(f"[✗] Erro durante extração: {e}")
            raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Extract data from PNCP API')
    parser.add_argument('--dataInicial', type=str, default=RECIFE_PROCUREMENT['dataInicial'],
                        help=f"Data inicial (padrão: {RECIFE_PROCUREMENT['dataInicial']})")
    parser.add_argument('--dataFinal', type=str, default=RECIFE_PROCUREMENT['dataFinal'],
                        help=f"Data final (padrão: {RECIFE_PROCUREMENT['dataFinal']})")
    parser.add_argument('--codigoModalidadeContratacao', type=str,
                        default=RECIFE_PROCUREMENT.get('codigoModalidadeContratacao'),
                        help="Código modalidade (opcional)")
    parser.add_argument('--codigoMunicipioIbge', type=str,
                        default=RECIFE_PROCUREMENT.get('codigoMunicipioIbge'),
                        help="Código município IBGE (opcional)")
    parser.add_argument('--tamanhoPagina', type=int, default=50,
                        help="Tamanho página (padrão: 50)")
    parser.add_argument('--maxPages', type=int, default=None,
                        help='Máximo de páginas (opcional)')

    args = parser.parse_args()

    params = {
        'dataInicial': args.dataInicial,
        'dataFinal': args.dataFinal,
        'tamanhoPagina': args.tamanhoPagina,
        'pagina': '1',
    }

    if args.codigoModalidadeContratacao:
        params['codigoModalidadeContratacao'] = args.codigoModalidadeContratacao

    if args.codigoMunicipioIbge:
        params['codigoMunicipioIbge'] = args.codigoMunicipioIbge

    worker = ExtractWorker()
    worker.run(params, max_pages=args.maxPages)
