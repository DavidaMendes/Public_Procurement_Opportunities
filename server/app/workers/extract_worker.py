"""Extract Worker - Kafka producer for PNCP data extraction."""
import argparse
import json
from datetime import datetime

from confluent_kafka import Producer

from app.etl.extract import Extract
from app.infrastructure.config import KAFKA_TOPICS, PRODUCER_CONFIG, RECIFE_PROCUREMENT


def delivery_report(err, msg):
    """Kafka delivery callback."""
    if err is not None:
        print(f"Erro na entrega da mensagem: {err}")
    else:
        print(f"Mensagem entregue ao topico {msg.topic()} particao {msg.partition()}")


class ExtractWorker:
    def __init__(self):
        self.producer = Producer(PRODUCER_CONFIG)
        self.extractor = Extract()

    def _publish_record_to_bronze_load_topic(self, message: bytes, message_key: bytes):
        self.producer.produce(
            topic=KAFKA_TOPICS["load_bronze_licitacoes"],
            value=message,
            key=message_key,
            callback=delivery_report,
        )

    def _publish_record_to_transform_topic(self, message: bytes, message_key: bytes):
        self.producer.produce(
            topic=KAFKA_TOPICS["transform_licitacoes"],
            value=message,
            key=message_key,
            callback=delivery_report,
        )

    def _publish_extracted_record_to_streaming_topics(self, record: dict):
        message = json.dumps(record, ensure_ascii=False, default=str).encode("utf-8")
        message_key = record["payload"].get("numeroControlePNCP", "").encode("utf-8")

        self._publish_record_to_bronze_load_topic(message, message_key)
        self._publish_record_to_transform_topic(message, message_key)
        self.producer.poll(0)

    def run(self, params: dict, max_pages: int = None):
        """
        Extract data from PNCP API and publish to bronze-load and transform topics.
        """
        params["extracted_at"] = datetime.utcnow().isoformat() + "Z"

        try:
            record_count = 0
            error_count = 0

            for record in self.extractor.extract_paginated(params, max_pages):
                try:
                    self._publish_extracted_record_to_streaming_topics(record)
                    record_count += 1

                    if record_count % 10 == 0:
                        self.producer.flush(timeout=5)
                        print(f"[OK] {record_count} registros publicados em load bronze e transform")

                except Exception as exc:
                    error_record = {
                        "error": str(exc),
                        "original_record": record,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                    }
                    error_message = json.dumps(error_record, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS["transform_licitacoes_dlq"],
                        value=error_message.encode("utf-8"),
                        callback=delivery_report,
                    )

                    error_count += 1

            self.producer.flush(timeout=10)
            print(f"\n[OK] Extracao concluida: {record_count} registros, {error_count} erros")

        except Exception as exc:
            print(f"[ERRO] Erro durante extracao: {exc}")
            raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract data from PNCP API")
    parser.add_argument(
        "--dataInicial",
        type=str,
        default=RECIFE_PROCUREMENT["dataInicial"],
        help=f"Data inicial (padrao: {RECIFE_PROCUREMENT['dataInicial']})",
    )
    parser.add_argument(
        "--dataFinal",
        type=str,
        default=RECIFE_PROCUREMENT["dataFinal"],
        help=f"Data final (padrao: {RECIFE_PROCUREMENT['dataFinal']})",
    )
    parser.add_argument(
        "--codigoModalidadeContratacao",
        type=str,
        default=RECIFE_PROCUREMENT.get("codigoModalidadeContratacao"),
        help="Codigo modalidade (opcional)",
    )
    parser.add_argument(
        "--codigoMunicipioIbge",
        type=str,
        default=RECIFE_PROCUREMENT.get("codigoMunicipioIbge"),
        help="Codigo municipio IBGE (opcional)",
    )
    parser.add_argument("--tamanhoPagina", type=int, default=50, help="Tamanho pagina (padrao: 50)")
    parser.add_argument("--maxPages", type=int, default=None, help="Maximo de paginas (opcional)")

    args = parser.parse_args()

    params = {
        "dataInicial": args.dataInicial,
        "dataFinal": args.dataFinal,
        "tamanhoPagina": args.tamanhoPagina,
        "pagina": "1",
    }

    if args.codigoModalidadeContratacao:
        params["codigoModalidadeContratacao"] = args.codigoModalidadeContratacao

    if args.codigoMunicipioIbge:
        params["codigoMunicipioIbge"] = args.codigoMunicipioIbge

    worker = ExtractWorker()
    worker.run(params, max_pages=args.maxPages)
