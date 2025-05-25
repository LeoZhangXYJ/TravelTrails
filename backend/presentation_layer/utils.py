# backend/presentation_layer/utils.py
# 此处放置输入校验、数据转换、响应格式化等工具函数

def validate_input(data, schema):
    """
    示例输入校验函数。
    """
    # TODO: 使用合适的库 (如 Pydantic, Marshmallow) 实现校验逻辑
    print(f"Validating data against schema {schema}: {data}")
    return True, {} # (is_valid, errors)

def format_response(data=None, error_message=None, status_code=200):
    """
    统一响应格式。
    """
    if error_message:
        return {"success": False, "error": error_message}, status_code
    return {"success": True, "data": data}, status_code 