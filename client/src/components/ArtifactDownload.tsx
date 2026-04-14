interface Props {
  content: string;
}

export function ArtifactDownload({ content }: Props) {
  function handleDownload() {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentique-output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="artifact-download">
      <h3>Final output</h3>
      <pre className="artifact-preview">{content}</pre>
      <button onClick={handleDownload}>Download output</button>
    </div>
  );
}
