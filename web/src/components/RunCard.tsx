import { App as AntdApp, Badge, Button, Card, Space } from 'antd';
import { CloudUploadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';

export function RunCard() {
  const { message } = AntdApp.useApp();
  const { runStatus, triggerRun } = useApp();

  const run = async () => {
    try {
      await triggerRun();
      message.info('已开始生成，可在下方查看实时日志');
    } catch (e) {
      message.error(String(e));
    }
  };

  return (
    <Card
      title={<Space><CloudUploadOutlined /> 立即生成 / 自动发布</Space>}
      extra={runStatus.running ? <Badge status="processing" text="渲染中（约几分钟）" /> : undefined}
    >
      <Button type="primary" icon={<PlayCircleOutlined />} onClick={run} loading={runStatus.running}>
        {runStatus.running ? '生成中…' : '立即生成视频'}
      </Button>
      <pre
        style={{
          marginTop: 16,
          background: '#0d1117',
          padding: 14,
          borderRadius: 8,
          maxHeight: 320,
          overflow: 'auto',
          fontSize: 12,
          color: '#c9d1d9',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {runStatus.log || '（暂无运行日志，点击「立即生成」开始）'}
      </pre>
    </Card>
  );
}
