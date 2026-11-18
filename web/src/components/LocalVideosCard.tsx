import { Button, Card, Divider, Empty, Space, Tag, Typography } from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  LinkOutlined,
  TagsOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { api, type PublishMeta } from '../api';
import { useApp } from '../context/AppContext';
import { fmtTime } from '../utils';

const { Text, Title, Paragraph } = Typography;

const STATUS_MAP: Record<PublishMeta['status'], { color: string; label: string }> = {
  draft: { color: 'orange', label: '未发布（草稿）' },
  published: { color: 'success', label: '已发布' },
  failed: { color: 'error', label: '发布失败' },
};

export function LocalVideosCard() {
  const { meta } = useApp();

  if (!meta) {
    return (
      <Card title={<Space><VideoCameraOutlined /> 最新成片</Space>}>
        <Empty description="暂无成片，先点击「立即生成」" />
      </Card>
    );
  }

  const st = STATUS_MAP[meta.status] ?? STATUS_MAP.draft;
  const videoRel = meta.video || 'final.mp4';

  return (
    <Card title={<Space><VideoCameraOutlined /> 最新成片</Space>}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* 播放器（poster 即封面，点开直接播） */}
        <div style={{ flex: '1 1 560px', maxWidth: 720, minWidth: 300 }}>
          <video
            src={api.videoFile(videoRel)}
            poster={api.cover()}
            controls
            style={{
              width: '100%',
              borderRadius: 10,
              background: '#000',
              aspectRatio: '16 / 9',
            }}
          />
          <Space style={{ marginTop: 12 }}>
            <Button
              size="small"
              href={api.videoFile(videoRel)}
              target="_blank"
              icon={<DownloadOutlined />}
            >
              下载原片
            </Button>
          </Space>
        </div>

        {/* 发布信息：标题 / 状态 / 标签 / 描述 */}
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>
              {meta.title}
            </Title>

            <Space size={8} wrap>
              <Tag color={st.color}>{st.label}</Tag>
              {meta.date && <Text type="secondary">{meta.date}</Text>}
              {meta.publishedAt ? (
                <Text type="secondary">{fmtTime(meta.publishedAt)}</Text>
              ) : null}
            </Space>

            {meta.status === 'published' && meta.bvid && (
              <a
                href={`https://www.bilibili.com/video/${meta.bvid}`}
                target="_blank"
                rel="noreferrer"
              >
                <Tag icon={<LinkOutlined />} color="blue">
                  {meta.bvid}
                </Tag>
                在 B站查看
              </a>
            )}

            <Divider style={{ margin: '6px 0' }} />

            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <TagsOutlined /> 投稿标签
              </Text>
              <div style={{ marginTop: 4 }}>
                {(meta.tag || '').split(',').filter(Boolean).map((t) => (
                  <Tag key={t} style={{ marginBottom: 4 }}>
                    {t}
                  </Tag>
                ))}
              </div>
            </div>

            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <FileTextOutlined /> 投稿描述
              </Text>
              <Paragraph
                style={{
                  marginTop: 4,
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {meta.desc}
              </Paragraph>
            </div>
          </Space>
        </div>
      </div>
    </Card>
  );
}
