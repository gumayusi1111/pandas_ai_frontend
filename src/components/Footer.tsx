import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <p>
        <i className="fas fa-code"></i> PandasAI 到 Pandas 转换器 &copy; {new Date().getFullYear()} | 
        生成可直接使用的标准 Pandas 代码
      </p>
    </footer>
  );
};

export default Footer; 