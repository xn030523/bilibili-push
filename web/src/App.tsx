import { App as AntdApp, Badge, Col, ConfigProvider, Layout, Row, Space, Typography, theme } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider, useApp } from './context/AppContext';
import { BiliLoginCard } from './components/BiliLoginCard';
import { KeyCard } from './components/KeyCard';
import { ScheduleCard } from './components/ScheduleCard';
import { RunCard } from './components/RunCard';
import { LocalVideosCard } from './components/LocalVideosCard';
import { PublishedVideosCard } from './components/PublishedVideosCard';

const { Header, Content } = Layout;
const { Title } = Typography;

function Dashboard() {
  const { loggedIn } = useApp();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: 24,
        }}
      >
        <Space align="center" size={12}>
          <VideoCameraOutlined style={{ fontSize: 22, color: '#69b1ff' }} />
          <Title level={4} style={{ margin: 0, color: '#fff' }}>
            AI 日报 · 管理面板
          </Title>
        </Space>
        <Badge
          status={loggedIn ? 'success' : 'default'}
          text={loggedIn ? 'B站已登录' : 'B站未登录'}
        />
      </Header>

      <Content style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <BiliLoginCard />
          </Col>

          <Col xs={24} lg={14}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <KeyCard />
              </Col>
              <Col xs={24} sm={12}>
                <ScheduleCard />
              </Col>
            </Row>
          </Col>

          <Col span={24}>
            <RunCard />
          </Col>

          <Col span={24}>
            <LocalVideosCard />
          </Col>

          <Col span={24}>
            <PublishedVideosCard />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#2e7bff' } }}
    >
      <AntdApp>
        <AppProvider>
          <Dashboard />
        </AppProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
