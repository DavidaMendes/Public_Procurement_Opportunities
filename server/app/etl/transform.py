class Transform():
    def __init__(self):
        pass

    def transform_data(self, data):
        filtered_data = []
        for item in data.get('data', []):
            if item.get('valorTotalEstimado') is not None and item['valorTotalEstimado'] < 81000:
                filtered_data.append(item)
        return filtered_data
    