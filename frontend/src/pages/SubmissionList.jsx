// ... 现有代码 ...

import { useState, useEffect } from 'react';
import { List, Card, Pagination, Spin, message } from 'antd';
import { Link } from 'react-router-dom';
import './SubmissionList.css'; // 确保有对应的CSS文件

function SubmissionList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
    totalPages: 0
  });

  const fetchSubmissions = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/submissions?page=${page}&page_size=${pagination.pageSize}`);
      if (!response.ok) {
        throw new Error('获取论文列表失败');
      }
      const data = await response.json();
      setSubmissions(data.data);
      setPagination({
        ...pagination,
        current: page,
        total: data.pagination.total,
        totalPages: data.pagination.total_pages
      });
    } catch (error) {
      message.error(error.message);
      console.error('获取论文列表出错:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(1);
  }, []);

  const handlePageChange = (page) => {
    fetchSubmissions(page);
  };

  return (
    <div className="submission-list-container">
      <h1>论文提交列表</h1>
      
      <Spin spinning={loading}>
        <List
          grid={{ gutter: 16, column: 2, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
          dataSource={submissions}
          renderItem={(item) => (
            <List.Item>
              <Card 
                title={item.论文标题} 
                extra={<Link to={`/submission/${item.id}`}>查看详情</Link>}
              >
                <p>ID: {item.id}</p>
                <p>内容摘要: {item.文档核心内容?.substring(0, 100) || '无内容'}...</p>
              </Card>
            </List.Item>
          )}
        />
        
        {!loading && submissions.length > 0 && (
          <div className="pagination-container" style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px' }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
              style={{ display: 'flex', justifyContent: 'center' }}
            />
          </div>
        )}
        
        {!loading && submissions.length === 0 && (
          <div className="empty-message" style={{ textAlign: 'center', margin: '40px 0' }}>
            暂无论文提交记录
          </div>
        )}
      </Spin>
    </div>
  );
}

export default SubmissionList;