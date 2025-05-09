// MarkdownRenderer.js
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownRenderer = ({ filePath, fallback }) => {
  const [content, setContent] = useState();

  useEffect(() => {
    fetch(filePath)
      .then((response) => response.text())
      .then((text) => setContent(text))
      .catch((error) => console.error("Error fetching Markdown file:", error));
  }, [filePath]);

  return (
    <div className="markdown-body">
      {content ? (
        <ReactMarkdown children={content} remarkPlugins={[remarkGfm]} />
      ) : (
        <p className="text-slate-600 mt-1 text-base">{fallback}</p>
      )}
    </div>
  );
};

export default MarkdownRenderer;
