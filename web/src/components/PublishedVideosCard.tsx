import { Button, Card, Empty, Image, Space, Table, Tooltip } from 'antd';
import { BarChartOutlined, PlaySquareOutlined } from '@ant-design/icons';
import type { PublishedVideo } from '../api';
import { useApp } from '../context/AppContext';
import { fmtTime, formatCount } from '../utils';

export function PublishedVideosCard() {
  const { published, loggedIn, refreshBili } = useApp();

  // 计数类数据列（播放/点赞/弹幕/评论/收藏）结构一致，用配置生成
  const countCols = [
    { title: '播放', key: 'play', sorter: true },
    { title: '点赞', key: 'like' },
    { title: '弹幕', key: 'danmaku' },
    { title: '评论', key: 'reply' },
    { title: '收藏', key: 'favorite' },
  ].map((c) => ({
    title: c.title,
    dataIndex: c.key,
    key: c.key,
    align: 'right' as const,
    ...(c.sorter
      ? {
          sorter: (a: PublishedVideo, b: PublishedVideo) => a.play - b.play,
          defaultSortOrder: 'descend' as const,
        }
      : {}),
    render: (v: number) => formatCount(v),
  }));

  const columns = [
    {
      title: '视频',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, r: PublishedVideo) => (
        <Space>
          <Image
            src={r.cover}
            width={56}
            height={36}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
          <Tooltip title={v}>
            <a
              href={`https://www.bilibili.com/video/${r.bvid}`}
              target="_blank"
              rel="noreferrer"
              style={{
                maxWidth: 220,
                display: 'inline-block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {v}
            </a>
          </Tooltip>
        </Space>
      ),
    },
    ...countCols,
    { title: '发布时间', dataIndex: 'pubtime', key: 'pubtime', render: (v: number) => (v ? fmtTime(v * 1000) : '—') },
  ];

  return (
    <Card
      title={<Space><BarChartOutlined /> 已发布视频 · 播放数据</Space>}
      extra={
        <Button type="link" onClick={refreshBili} icon={<PlaySquareOutlined />}>
          刷新
        </Button>
      }
    >
      {!loggedIn ? (
        <Empty description="登录后查看已发布视频的播放数据" />
      ) : (
        <Table
          rowKey="bvid"
          columns={columns}
          dataSource={published}
          pagination={false}
          size="middle"
          locale={{ emptyText: <Empty description="暂无已发布视频" /> }}
        />
      )}
    </Card>
  );
}
