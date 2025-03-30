import Link from "next/link";
import React, { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Partial<Components> = {
    pre: ({ children }) => <>{children}</>,
    p: ({ node, children, ...props }) => {
        return (
            <p className="my-4 leading-relaxed" {...props}>
                {children}
            </p>
        );
    },
    ol: ({ node, children, ...props }) => {
        return (
            <ol className="list-decimal list-outside ml-4 my-4" {...props}>
                {children}
            </ol>
        );
    },
    li: ({ node, children, ...props }) => {
        return (
            <li className="py-1" {...props}>
                {children}
            </li>
        );
    },
    ul: ({ node, children, ...props }) => {
        return (
            <ul className="list-disc list-outside ml-4 my-4" {...props}>
                {children}
            </ul>
        );
    },
    strong: ({ node, children, ...props }) => {
        return (
            <span className="font-semibold" {...props}>
                {children}
            </span>
        );
    },
    a: ({ node, children, ...props }) => {
        return (
            // @ts-expect-error error
            <Link
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noreferrer"
                {...props}
            >
                {children}
            </Link>
        );
    },
    h1: ({ node, children, ...props }) => {
        return (
            <h1 className="text-3xl font-semibold mt-8 mb-4" {...props}>
                {children}
            </h1>
        );
    },
    h2: ({ node, children, ...props }) => {
        return (
            <h2 className="text-2xl font-semibold mt-8 mb-4" {...props}>
                {children}
            </h2>
        );
    },
    h3: ({ node, children, ...props }) => {
        return (
            <h3 className="text-xl font-semibold mt-6 mb-3" {...props}>
                {children}
            </h3>
        );
    },
    h4: ({ node, children, ...props }) => {
        return (
            <h4 className="text-lg font-semibold mt-6 mb-3" {...props}>
                {children}
            </h4>
        );
    },
    h5: ({ node, children, ...props }) => {
        return (
            <h5 className="text-base font-semibold mt-4 mb-2" {...props}>
                {children}
            </h5>
        );
    },
    h6: ({ node, children, ...props }) => {
        return (
            <h6 className="text-sm font-semibold mt-4 mb-2" {...props}>
                {children}
            </h6>
        );
    },
    code: ({ node, className, children, ...props }) => {
        return (
            <code
                className={`${className} bg-muted px-1 py-0.5 rounded text-sm`}
                {...props}
            >
                {children}
            </code>
        );
    },
    blockquote: ({ node, children, ...props }) => {
        return (
            <blockquote
                className="border-l-4 border-muted pl-4 italic my-4"
                {...props}
            >
                {children}
            </blockquote>
        );
    },
    table: ({ node, children, ...props }) => {
        return (
            <div className="my-4 overflow-x-auto">
                <table className="min-w-full border border-white" {...props}>
                    {children}
                </table>
            </div>
        );
    },
    thead: ({ node, children, ...props }) => {
        return (
            <thead className="bg-muted/50" {...props}>
                {children}
            </thead>
        );
    },
    tbody: ({ node, children, ...props }) => {
        return (
            <tbody className="divide-y divide-white" {...props}>
                {children}
            </tbody>
        );
    },
    tr: ({ node, children, ...props }) => {
        return (
            <tr className="hover:bg-muted/50" {...props}>
                {children}
            </tr>
        );
    },
    th: ({ node, children, ...props }) => {
        return (
            <th
                className="px-4 py-2 text-left text-sm font-semibold text-foreground border border-white"
                {...props}
            >
                {children}
            </th>
        );
    },
    td: ({ node, children, ...props }) => {
        return (
            <td className="px-4 py-2 text-sm border border-white" {...props}>
                {children}
            </td>
        );
    },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
    return (
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
            {children}
        </ReactMarkdown>
    );
};

export const Markdown = memo(
    NonMemoizedMarkdown,
    (prevProps, nextProps) => prevProps.children === nextProps.children
); 