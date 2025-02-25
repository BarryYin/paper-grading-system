import { FeishuService } from '../lib/feishu';

async function testFeishuConnection() {
  console.log('开始测试飞书服务连接...');

  const feishuService = new FeishuService({
    appId: process.env.FEISHU_APP_ID || '',
    appSecret: process.env.FEISHU_APP_SECRET || '',
    tableId: process.env.FEISHU_TABLE_ID || '',
    viewId: process.env.FEISHU_VIEW_ID || ''
  });

  try {
    // 测试获取提交历史
    console.log('测试获取提交历史...');
    const history = await feishuService.getSubmissionHistory();
    console.log('提交历史获取成功：', history);

    // 测试提交论文
    console.log('\n测试提交论文...');
    const content = '这是一个测试提交的内容';
    const recordId = await feishuService.submitPaper(content);
    console.log('论文提交成功，记录ID：', recordId);

    // 测试获取提交结果
    console.log('\n测试获取提交结果...');
    const result = await feishuService.getSubmissionResult(recordId);
    console.log('提交结果获取成功：', result);

    console.log('\n所有测试完成！API 连接正常！');
  } catch (error) {
    console.error('测试过程中发生错误：', error);
  }
}

// 运行测试
testFeishuConnection();