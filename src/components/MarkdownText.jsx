import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { decodeHtmlEntities } from '../utils/text';

const MarkdownText = ({ text, className }) => {
    if (!text) return null;

    const normalized = decodeHtmlEntities(text);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className={className}
            components={{
                p: ({ node, ...props }) => <p className="m-0" {...props} />,
                ul: ({ node, ...props }) => <ul className="m-0 pl-5 list-disc" {...props} />,
                ol: ({ node, ...props }) => <ol className="m-0 pl-5 list-decimal" {...props} />,
                li: ({ node, ...props }) => <li className="m-0" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-gray-200 pl-3 italic" {...props} />,
                code: ({ node, inline, ...props }) => (
                    inline ? <code className="px-1 py-0.5 bg-gray-100 rounded text-[0.9em]" {...props} /> :
                        <code className="block px-3 py-2 bg-gray-100 rounded text-[0.9em] overflow-x-auto" {...props} />
                )
            }}
        >
            {normalized}
        </ReactMarkdown>
    );
};

export default MarkdownText;
