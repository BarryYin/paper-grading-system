"""
Pydantic模型辅助函数
兼容不同版本的Pydantic API
"""
import json
from typing import Any, Dict

def safe_serialize_model(model: Any) -> Dict[str, Any]:
    """
    安全地将Pydantic模型转为字典，兼容不同版本
    
    Args:
        model: Pydantic模型实例
    
    Returns:
        Dict: 模型数据的字典表示
    """
    # 尝试Pydantic v2 API
    if hasattr(model, "model_dump"):
        return model.model_dump()
    
    # 尝试Pydantic v1 API
    if hasattr(model, "dict"):
        return model.dict()
    
    # 后备方案：直接使用__dict__
    return dict(model.__dict__)

def model_to_json(model: Any, indent: int = None) -> str:
    """
    将Pydantic模型转换为JSON字符串
    
    Args:
        model: Pydantic模型实例
        indent: 缩进空格数，默认为None(无缩进)
    
    Returns:
        str: JSON字符串
    """
    # 尝试Pydantic v2 API (先尝试直接方法)
    if hasattr(model, "model_dump_json"):
        try:
            if indent is not None:
                return model.model_dump_json(indent=indent)
            else:
                return model.model_dump_json()
        except TypeError:
            # 如果indent不再支持，尝试无参数方式
            return model.model_dump_json()
    
    # 尝试Pydantic v1 API
    if hasattr(model, "json"):
        try:
            if indent is not None:
                return model.json(indent=indent)
            else:
                return model.json()
        except TypeError:
            # 如果参数不支持，尝试无参数方式
            return model.json()
    
    # 后备方案：手动转换为字典并序列化
    model_dict = safe_serialize_model(model)
    return json.dumps(model_dict, indent=indent, ensure_ascii=False)

def print_model(model: Any, title: str = "模型数据") -> None:
    """
    打印模型数据到控制台
    
    Args:
        model: Pydantic模型实例
        title: 打印的标题
    """
    print(f"\n--- {title} ---")
    try:
        json_str = model_to_json(model, indent=2)
        print(json_str)
    except Exception as e:
        print(f"无法序列化模型: {e}")
        print("尝试直接打印属性:")
        for k, v in safe_serialize_model(model).items():
            print(f"  {k}: {v}")
    print("---" + "-" * len(title) + "---")
