import SubtitleTool from './subtitle-tool/SubtitleTool';
import RateLimitStatusBar from './subtitle-tool/RateLimitStatus';

export default function App() {
  return (
    <>
      <RateLimitStatusBar />
      <SubtitleTool />
    </>
  );
}
