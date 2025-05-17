import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="header">
      <h1>
        <i className="fas fa-magic"></i> PandasAI 到 Pandas 代码转换器
      </h1>
      <p>从自然语言生成标准 Pandas 代码</p>
    </header>
  );
};

export default Header; 