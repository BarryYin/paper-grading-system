/**
 * API请求调试工具，用于追踪前后端通信问题
 */

// 配置
const DEBUG_MODE = true;
const API_BASE_URL = 'http://localhost:8000';

/**
 * 发送带调试信息的API请求
 * 
 * @param {string} endpoint - API端点，如 '/api/submissions/receDrtyx8'
 * @param {Object} options - 请求选项
 * @returns {Promise<any>} 解析后的响应数据
 */
export async function debugRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const requestId = Math.random().toString(36).substring(2, 8);
  const method = options.method || 'GET';
  
  // 记录请求
  if (DEBUG_MODE) {
    console.log(`[API-${requestId}] 发送请求: ${method} ${url}`);
    if (options.body) {
      console.log(`[API-${requestId}] 请求体:`, 
        typeof options.body === 'string' ? JSON.parse(options.body) : options.body);
    }
  }

  const startTime = performance.now();
  
  try {
    // 发送请求
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // 确保包含Cookie
    });
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    if (DEBUG_MODE) {
      console.log(`[API-${requestId}] 响应状态: ${response.status} (${duration}ms)`);
    }

    // 尝试解析响应为JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      if (DEBUG_MODE) {
        console.log(`[API-${requestId}] 响应数据:`, data);
      }
    } else {
      if (DEBUG_MODE) {
        console.log(`[API-${requestId}] 非JSON响应:`, await response.text());
      }
    }
    
    // 检查是否成功
    if (!response.ok) {
      throw new Error(data?.detail || `API请求失败: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    if (DEBUG_MODE) {
      console.error(`[API-${requestId}] 请求错误:`, error);
    }
    throw error;
  }
}

/**
 * 测试API端点可访问性
 * @param {string} endpoint - 要测试的API端点
 * @returns {Promise<boolean>} - 端点是否可访问
 */
export async function testEndpoint(endpoint) {
  try {
    console.log(`测试API端点: ${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'OPTIONS',
      credentials: 'include',
    });
    console.log(`端点 ${endpoint} 测试结果:`, response.status);
    return response.ok;
  } catch (error) {
    console.error(`端点 ${endpoint} 测试失败:`, error);
    return false;
  }
}

/**
 * 检查服务器是否运行
 * @returns {Promise<boolean>} 服务器是否在运行
 */
export async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      cache: 'no-cache',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('服务器状态正常:', data);
      return true;
    } else {
      console.error('服务器响应错误:', response.status);
      return false;
    }
  } catch (error) {
    console.error('服务器连接失败:', error);
    return false;
  }
}

/**
 * 提供静态测试数据（当API不可用时使用）
 * @param {string} type - 数据类型，如 'submission'
 * @param {string} id - 资源ID
 * @returns {Object|null} 静态测试数据
 */
export function getStaticTestData(type, id) {
  if (type === 'submission') {
    // 论文测试数据
    const submissions = {
      'receDrtyx8': {
        id: 'receDrtyx8',
        title: '机器学习在自然语言处理中的应用',
        content: '这是一篇关于NLP和机器学习的测试论文...',
        author: '张三',
        course: '高级人工智能',
        status: 'pending',
        created_at: '2023-10-15T08:30:00',
        updated_at: '2023-10-15T08:30:00',
      },
      'recuEG6Z8QuOWy': {
        id: 'recuEG6Z8QuOWy',
        title: '区块链技术在供应链管理中的应用',
        content: '这是一篇关于区块链的测试论文...',
        author: '李四',
        course: '区块链与商业应用',
        status: 'graded',
        created_at: '2023-10-20T14:45:00',
        updated_at: '2023-10-20T14:45:00',
        grade: 92.5,
        feedback: '论文结构清晰，论证有力，但案例分析部分可以更加深入。'
      },
      'recPFmvHG1': {
        id: 'recPFmvHG1',
        title: '可持续发展与绿色能源技术',
        content: '这是一篇关于可持续能源的测试论文...',
        author: '王五',
        course: '环境科学与可持续发展',
        status: 'pending',
        created_at: '2023-11-05T10:15:00',
        updated_at: '2023-11-05T10:15:00',
      }
    };
    
    return submissions[id] || null;
  }
  
  return null;
}

export default {
  debugRequest,
  testEndpoint,
  checkServerStatus,
  getStaticTestData
};
