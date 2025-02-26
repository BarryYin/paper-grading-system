import json

import lark_oapi as lark
from lark_oapi.api.drive.v1 import *


# SDK 使用说明: https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/python--sdk/preparations-before-development
# 以下示例代码默认根据文档示例值填充，如果存在代码问题，请在 API 调试台填上相关必要参数后再复制代码使用
def main():
    # 创建client
    # 使用 user_access_token 需开启 token 配置, 并在 request_option 中配置 token
    # client = lark.Client.builder() \
    #     .enable_set_token(True) \
    #     .log_level(lark.LogLevel.DEBUG) \
    #     .build()
    
     # 创建client
    client = lark.Client.builder() \
        .app_id("cli_a7dad3e298b8500e")\
        .app_secret("UfFx9CqEhqP06qwGFetqzezliNeDO2Hp")\
        .log_level(lark.LogLevel.DEBUG) \
        .build()

    # 构造请求对象
    file = open("论文开题报告登记表_迟迅通.docx", "rb")
    request: UploadAllFileRequest = UploadAllFileRequest.builder() \
        .request_body(UploadAllFileRequestBody.builder()
            .file_name("论文1")
            .parent_type("bitable_file")
            .parent_node("EizAbvZvxaTrKlsiumGcXLBuneb")
            .size("48519")
            .file(file)
            .build()) \
        .build()

    # 发起请求
    # option = lark.RequestOption.builder().user_access_token("u-eMxCg2Hw5bOEBjfaX.6l2Blh67fNlhT3Oww014i20CB.").build()
    #response: UploadAllFileResponse = client.drive.v1.file.upload_all(request, option)


    response: UploadAllFileResponse = client.drive.v1.file.upload_all(request)
    # 处理失败返回
    if not response.success():
        lark.logger.error(
            f"client.drive.v1.file.upload_all failed, code: {response.code}, msg: {response.msg}, log_id: {response.get_log_id()}, resp: \n{json.dumps(json.loads(response.raw.content), indent=4, ensure_ascii=False)}")
        return

    # 处理业务结果
    lark.logger.info(lark.JSON.marshal(response.data, indent=4))


if __name__ == "__main__":
    main()
