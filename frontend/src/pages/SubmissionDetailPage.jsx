import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { debugRequest, getStaticTestData } from '../utils/api-debug';

const SubmissionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [useStaticData, setUseStaticData] = useState(false);

  // 加载论文详情
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) {
        setError('论文ID无效');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      console.log(`正在获取论文详情，ID: ${id}`);
      setDebugInfo(prev => ({ ...prev, id, fetchStartTime: new Date().toISOString() }));

      try {
        // 第一步：尝试使用调试工具发送API请求
        console.log('尝试从API获取论文...');
        const apiUrl = `/api/submissions/${id}`;
        setDebugInfo(prev => ({ ...prev, apiUrl }));
        
        try {
          const data = await debugRequest(apiUrl);
          console.log('成功从API获取论文:', data);
          setSubmission(data);
          setFeedback(data.feedback || '');
          setGrade(data.grade || '');
          setUseStaticData(false);
          setDebugInfo(prev => ({ ...prev, apiSuccess: true, dataSource: 'api' }));
        } catch (apiError) {
          console.error('API请求失败，尝试使用静态数据:', apiError);
          setDebugInfo(prev => ({ 
            ...prev, 
            apiError: apiError.message, 
            apiSuccess: false 
          }));
          
          // 第二步：如果API失败，尝试使用静态测试数据
          const staticData = getStaticTestData('submission', id);
          if (staticData) {
            console.log('使用静态测试数据:', staticData);
            setSubmission(staticData);
            setFeedback(staticData.feedback || '');
            setGrade(staticData.grade || '');
            setUseStaticData(true);
            setDebugInfo(prev => ({ ...prev, dataSource: 'static' }));
          } else {
            throw new Error(`找不到ID为 ${id} 的论文数据`);
          }
        }
      } catch (err) {
        console.error('获取论文详情失败:', err);
        setError(err.message || '无法加载论文详情');
        setDebugInfo(prev => ({ ...prev, finalError: err.message }));
      } finally {
        setLoading(false);
        setDebugInfo(prev => ({ ...prev, fetchEndTime: new Date().toISOString() }));
      }
    };

    if (id) {
      fetchSubmission();
    }
  }, [id]);

  // 提交评分和反馈
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (useStaticData) {
        // 使用静态数据时模拟操作
        setSubmission(prev => ({
          ...prev,
          grade: parseFloat(grade),
          feedback: feedback,
          status: 'graded'
        }));
        setIsEditing(false);
        alert('评分已成功提交（使用静态数据）');
        return;
      }
      
      const response = await debugRequest(`/api/submissions/${id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: parseFloat(grade),
          feedback: feedback,
          status: 'graded'
        })
      });
      
      setSubmission(response);
      setIsEditing(false);
      alert('评分已成功提交');
    } catch (err) {
      console.error('提交评分失败:', err);
      alert(`提交评分失败: ${err.message}`);
    }
  };

  // 删除论文
  const handleDelete = async () => {
    if (!window.confirm('确定要删除这篇论文吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      if (useStaticData) {
        // 使用静态数据时模拟操作
        navigate('/submissions');
        return;
      }
      
      await debugRequest(`/api/submissions/${id}`, {
        method: 'DELETE',
      });
      
      navigate('/submissions');
      alert('论文已删除');
    } catch (err) {
      console.error('删除论文失败:', err);
      alert(`删除论文失败: ${err.message}`);
    }
  };

  // 显示加载中状态
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>正在加载论文详情...</p>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="error-container">
        <h2>加载论文失败</h2>
        <p className="error-message">{error}</p>
        
        <div className="debug-section">
          <h3>调试信息</h3>
          <p>论文ID: {id}</p>
          <p>请求URL: {debugInfo.apiUrl}</p>
          <p>API请求结果: {debugInfo.apiSuccess ? '成功' : '失败'}</p>
          {debugInfo.apiError && <p>API错误: {debugInfo.apiError}</p>}
          
          <div className="actions">
            <button onClick={() => navigate('/submissions')}>返回列表</button>
            <button onClick={() => window.location.reload()}>重试</button>
          </div>
        </div>
      </div>
    );
  }

  // 如果没有论文数据
  if (!submission) {
    return (
      <div className="not-found">
        <h2>论文未找到</h2>
        <p>ID为 <strong>{id}</strong> 的论文不存在或已被删除。</p>
        <button onClick={() => navigate('/submissions')}>返回列表</button>
      </div>
    );
  }

  // 显示论文详情
  return (
    <div className="submission-detail">
      {useStaticData && (
        <div className="static-data-notice" style={{
          background: '#fff3cd',
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          border: '1px solid #ffeeba'
        }}>
          ⚠️ 使用静态测试数据（API请求失败）
        </div>
      )}
      
      <h2>{submission.title || submission.论文标题}</h2>
      
      <div className="meta-info">
        <p><strong>ID:</strong> {submission.id}</p>
        <p><strong>作者:</strong> {submission.author || submission.username || '未知作者'}</p>
        <p><strong>课程:</strong> {submission.course || '未指定课程'}</p>
        <p><strong>状态:</strong> {submission.status === 'pending' ? '待评阅' : '已评阅'}</p>
        <p><strong>提交时间:</strong> {
          submission.created_at ? 
          new Date(submission.created_at).toLocaleString() : 
          '未知时间'
        }</p>
        {submission.description && (
          <p><strong>描述:</strong> {submission.description}</p>
        )}
      </div>
      
      <div className="content-section">
        <h3>论文内容</h3>
        <div className="paper-content">
          {submission.content || submission.文档核心内容 || '无内容'}
        </div>
      </div>
      
      <div className="grading-section">
        <h3>评分与反馈</h3>
        
        {isEditing ? (
          <form onSubmit={handleGradeSubmit}>
            <div className="form-group">
              <label htmlFor="grade">分数</label>
              <input
                type="number"
                id="grade"
                min="0"
                max="100"
                step="0.1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="feedback">反馈</label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows="6"
                required
              />
            </div>
            
            <div className="button-group">
              <button type="submit">提交评分</button>
              <button type="button" onClick={() => setIsEditing(false)}>取消</button>
            </div>
          </form>
        ) : (
          <div className="grade-display">
            {submission.grade ? (
              <>
                <p><strong>分数:</strong> {submission.grade}</p>
                <p><strong>反馈:</strong> {submission.feedback || '无反馈'}</p>
                <button onClick={() => setIsEditing(true)}>编辑评分</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}>添加评分</button>
            )}
          </div>
        )}
      </div>
      
      <div className="actions">
        <button onClick={() => navigate('/submissions')}>返回列表</button>
        <button onClick={handleDelete} className="delete-button">删除论文</button>
      </div>
    </div>
  );
};

export default SubmissionDetailPage;
