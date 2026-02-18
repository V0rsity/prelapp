// pages/terms.tsx
import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "content", "terms.md");
  const content = fs.readFileSync(filePath, "utf8");
  return { props: { content } };
}

export default function Terms({ content }: { content: string }) {
  return (
    <div className="dashboard-wrapper auth-page">
      <div id="topbar">
        <button onClick={() => window.close()} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
          <img src="/images/Logo-Mobile.png" alt="Prelapp" />
        </button>
      </div>

      <div className="main-content">
        <div className="main-container terms-container">
          <ReactMarkdown>{content}</ReactMarkdown>
          <div className="terms-back">
            <button onClick={() => window.close()}>← Back to Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  );
}
