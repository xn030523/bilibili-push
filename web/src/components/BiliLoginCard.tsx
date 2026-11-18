import { useEffect, useRef, useState } from 'react';
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Col,
  QRCode,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { ApiOutlined, UserOutlined } from '@ant-design/icons';
import { api, type QrInfo } from '../api';
import { useApp } from '../context/AppContext';

const { Text } = Typography;

export function BiliLoginCard() {
  const { message } = AntdApp.useApp();
  const { config, account, loggedIn, refreshConfig, refreshBili } = useApp();

  const [qr, setQr] = useState<QrInfo | null>(null);
  const [loginHint, setLoginHint] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);
  const pollTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    },
    [],
  );

  const stopPolling = () => {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const startLogin = async () => {
    setLoadingQr(true);
    try {
      const info = await api.qrcode();
      setQr(info);
      setLoginHint('请用 B站 App 扫码');
      stopPolling();
      pollTimer.current = window.setInterval(async () => {
        try {
          const r = await api.poll(info.qrcodeKey);
          if (r.status === 'success') {
            stopPolling();
            setQr(null);
            message.success('B站登录成功');
            await refreshConfig();
            await refreshBili();
          } else if (r.status === 'scanned') {
            setLoginHint('已扫码，请在手机上确认');
          } else if (r.status === 'expired') {
            stopPolling();
            setQr(null);
            message.warning('二维码已过期，请重新获取');
          }
        } catch (e) {
          stopPolling();
          message.error(String(e));
        }
      }, 2000);
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoadingQr(false);
    }
  };

  return (
    <Card title={<Space><ApiOutlined /> B站扫码登录</Space>}>
      {loggedIn ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space size={16} align="center">
            <Avatar size={56} src={account?.face} icon={<UserOutlined />} />
            <div>
              <Space size={8}>
                <Text strong style={{ fontSize: 16 }}>
                  {account?.uname || '加载中…'}
                </Text>
                {account?.vip && <Tag color="gold">大会员</Tag>}
                {account?.level ? <Tag color="blue">LV{account.level}</Tag> : null}
              </Space>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  UID {account?.mid || config?.bilibili.dedeuserid || '—'}
                </Text>
              </div>
            </div>
          </Space>
          {account && (
            <Row gutter={12}>
              <Col span={8}>
                <Statistic title="关注" value={account.following} />
              </Col>
              <Col span={8}>
                <Statistic title="粉丝" value={account.follower} />
              </Col>
              <Col span={8}>
                <Statistic title="硬币" value={account.coins} />
              </Col>
            </Row>
          )}
          <Button onClick={startLogin} block>
            重新登录
          </Button>
        </Space>
      ) : (
        <Space direction="vertical" size={12} style={{ width: '100%', alignItems: 'center' }}>
          {qr ? (
            <>
              <QRCode value={qr.url} size={200} />
              <Text type={loginHint === '登录成功' ? 'success' : 'secondary'}>{loginHint}</Text>
            </>
          ) : (
            <Button type="primary" loading={loadingQr} onClick={startLogin}>
              获取二维码
            </Button>
          )}
        </Space>
      )}
    </Card>
  );
}
