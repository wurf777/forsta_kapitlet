import React from 'react';
import ReactMarkdown from 'react-markdown';
import PreferenceChip from './PreferenceChip';

const ChatMessage = ({ text, sender, modes, onPreferenceChange }) => {
    if (sender === 'user') {
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
    }

    // Bibbi messages: render with markdown and custom link handler for pref: links
    return (
        <ReactMarkdown
            urlTransform={(url) => {
                // Allow pref: URLs through without sanitization
                if (url.startsWith('pref:')) return url;
                // Default behavior for other URLs
                return url;
            }}
            components={{
                // eslint-disable-next-line no-unused-vars
                p: ({ node, ...props }) => (
                    <p className="text-sm leading-relaxed m-0" {...props} />
                ),
                // eslint-disable-next-line no-unused-vars
                ul: ({ node, ...props }) => <ul className="m-0 pl-5 list-disc text-sm" {...props} />,
                // eslint-disable-next-line no-unused-vars
                ol: ({ node, ...props }) => <ol className="m-0 pl-5 list-decimal text-sm" {...props} />,
                // eslint-disable-next-line no-unused-vars
                li: ({ node, ...props }) => <li className="m-0" {...props} />,
                // eslint-disable-next-line no-unused-vars
                strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                // eslint-disable-next-line no-unused-vars
                em: ({ node, ...props }) => <em {...props} />,
                // eslint-disable-next-line no-unused-vars
                a: ({ node, href, children, ...props }) => {
                    // Intercept pref: links and render as PreferenceChip
                    if (href && href.startsWith('pref:')) {
                        const type = href.replace('pref:', '');
                        const currentValue = modes?.[type];
                        if (currentValue !== undefined) {
                            return (
                                <PreferenceChip
                                    type={type}
                                    label={String(children)}
                                    currentValue={currentValue}
                                    onConfirm={onPreferenceChange}
                                />
                            );
                        }
                    }
                    // Regular links
                    return (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent underline hover:text-accent/80"
                            {...props}
                        >
                            {children}
                        </a>
                    );
                }
            }}
        >
            {text}
        </ReactMarkdown>
    );
};

export default ChatMessage;
