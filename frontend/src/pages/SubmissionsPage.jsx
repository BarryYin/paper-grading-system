import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 为调试添加示例数据
  const exampleSubmissions = [
    {
      id: "receDrtyx8",
      title: "机器学习在自然语言处理中的应用",
      author: "张三",
      course: "人工智能",
      status: "pending",
      created_at: "2023-10-15T08:30:00",
    },
    {
      id: "recuEG6Z8QuOWy",
      title: "区块链技术在供应链管理中的应用", 
      author: "李四",
      course: "区块链技术",
      status: "graded",
      created_at: "2023-10-20T14:45:00",
    },
    {
      id: "recPFmvHG1",
      title: "可持续发展与绿色能源技术",
      author: "王五",
      course: "环境科学",
      status: "pending",
      created_at: "2023-11-05T10:15:00",
    }
  ];

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        console.log('正在获取论文列表...');
        
        // 尝试从API获取数据
        try {
          const response = await axios.get('/api/submissions');
          if (response.data && Array.isArray(response.data)) {
            console.log(`从API获取到 ${response.data.length} 篇论文`);
            setSubmissions(response.data);
            return;
          }
        } catch (apiError) {
          console.warn('从API获取数据失败，使用示例数据:', apiError);
        }
        
        // 如果API获取失败，使用示例数据
        console.log('使用示例数据');
        setSubmissions(exampleSubmissions);
        
      } catch (err) {
        console.error('获取论文列表失败:', err);
        setError(err.message || '获取论文列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);
  
  // 添加测试论文函数
  const addTestSubmission = () => {
    const newSubmission = {
      id: `rec${Math.random().toString(36).substr(2, 8)}`,
      title: `测试论文 ${new Date().toLocaleDateString()}`,
      author: "测试用户",
      course: "测试课程",
      status: "pending",
      created_at: new Date().toISOString(),
    };
    
    setSubmissions([...submissions, newSubmission]);
    alert(`已添加测试论文，ID: ${newSubmission.id}`);
  };

  // 改进链接处理方式，确保正确导航
  const navigate = useNavigate();
  
  const handleViewSubmission = (id) => {
    console.log(`导航到论文详情: ${id}`);
    navigate(`/submissions/${id}`);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>出错了</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div className="submissions-page">
      <h1>论文列表</h1>
      
      <div className="actions">
        <button onClick={addTestSubmission} className="add-button">
          添加测试论文
        </button>
      </div>
      
      {submissions.length === 0 ? (
        <p>暂无论文提交</p>
      ) : (
        <div className="submissions-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>作者</th>
                <th>课程</th>
                <th>状态</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(submission => (
                <tr key={submission.id}>
                  <td>{submission.id}</td>
                  <td>{submission.title}</td>
                  <td>{submission.author}</td>
                  <td>{submission.course}</td>
                  <td>{submission.status === 'pending' ? '待评阅' : '已评阅'}</td>
                  <td>{new Date(submission.created_at).toLocaleDateString()}</td>
                  <td>
                    {/* 添加多种导航方式 */}
                    <button 
                      onClick={() => handleViewSubmission(submission.id)} 
                      className="view-button"
                    >
                      查看详情
                    </button>
                    <br />
                    <Link to={`/submissions/${submission.id}`} className="view-link">
                      Link方式
                    </Link>
                    <br />
                    <a 
                      href={`/submissions/${submission.id}`} 
                      className="fallback-link"
                    >
                      直接链接
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="submission-links">
            <h3>直接链接测试</h3>
            <ul>
              {submissions.map(submission => (
                <li key={`link-${submission.id}`}>
                  <a href={`/submissions/${submission.id}`}>
                    {submission.title} ({submission.id})
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;
