import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#2d3748' /* A slightly darker gray, adjust as needed */ }}>
      <div>
        <h1>
          <i className="fas fa-magic" style={{ marginRight: '0.5rem' }}></i> PandasAI 到 Pandas 代码转换器
        </h1>
        <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#a0aec0' /* Lighter gray for subtitle */ }}>从自然语言生成标准 Pandas 代码</p>
      </div>
      <nav>
        <Link to="/settings/ai-provider" style={{ color: '#63b3ed', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
          AI 设置
        </Link>
      </nav>
    </header>
  );
};

export default Header; 