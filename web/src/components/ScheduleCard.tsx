import { useEffect, useState } from 'react';
import { App as AntdApp, Button, Card, Input, Space, Switch, Typography } from 'antd';
import { ScheduleOutlined } from '@ant-design/icons';
import { api } from '../api';
import { useApp } from '../context/AppContext';

const { Text } = Typography;

export function ScheduleCard() {
  const { message } = AntdApp.useApp();
  const { config, refreshConfig } = useApp();
  const [cron, setCron] = useState('0 8 * * *');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (config) {
      setCron(config.schedule.cron);
      setEnabled(config.schedule.enabled);
    }
  }, [config]);

  const save = async () => {
    try {
      await api.saveConfig({ schedule: { cron, enabled } });
      await refreshConfig();
      message.success('定时已保存');
    } catch (e) {
      message.error(String(e));
    }
  };

  return (
    <Card title={<Space><ScheduleOutlined /> 定时任务</Space>}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Input value={cron} onChange={(e) => setCron(e.target.value)} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          <Text code>0 8 * * *</Text> 每天 08:00；<Text code>0 */6 * * *</Text> 每 6 小时
        </Text>
        <Space>
          <Switch checked={enabled} onChange={setEnabled} />
          <Text>启用定时</Text>
        </Space>
        <Button onClick={save} block>
          保存定时
        </Button>
      </Space>
    </Card>
  );
}
