import { useState } from 'react';
import { App as AntdApp, Button, Card, Input, Space, Tag, Typography } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { api } from '../api';
import { useApp } from '../context/AppContext';

const { Text } = Typography;

export function KeyCard() {
  const { message } = AntdApp.useApp();
  const { config, refreshConfig } = useApp();
  const [key, setKey] = useState('');

  const save = async () => {
    if (!key.trim()) return message.warning('请输入密钥');
    try {
      await api.saveConfig({ deepseekApiKey: key.trim() });
      setKey('');
      await refreshConfig();
      message.success('密钥已保存');
    } catch (e) {
      message.error(String(e));
    }
  };

  return (
    <Card title={<Space><KeyOutlined /> 密钥管理</Space>}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Input.Password
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={config?.deepseekApiKey ? '已设置（留空则不修改）' : 'sk-...'}
        />
        <Button type="primary" onClick={save} block>
          保存密钥
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          当前状态：
          {config?.deepseekApiKey ? (
            <Tag color="success" style={{ marginInlineStart: 8 }}>
              已设置
            </Tag>
          ) : (
            <Tag style={{ marginInlineStart: 8 }}>未设置</Tag>
          )}
        </Text>
      </Space>
    </Card>
  );
}
