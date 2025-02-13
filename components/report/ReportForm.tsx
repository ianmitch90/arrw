import React, { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useUser } from '@/components/contexts/UserContext';
import { Report } from '@/components/types';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Button
} from '@heroui/react';

const ReportForm = () => {
  const { user } = useUser();
  const [report, setReport] = useState<Omit<Report, 'id' | 'created_at'>>({
    reported_user_id: '',
    reason: '',
    description: '',
    reporter_id: ''
  });

  const submitReport = async () => {
    const { error } = await supabase
      .from('user_reports')
      .insert([{ ...report, reporter_id: user?.id }]);

    if (error) {
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h1>Report User</h1>
      </CardHeader>
      <CardBody>
        <Input
          fullWidth
          label="Reported User ID"
          value={report.reported_user_id}
          onChange={(e) =>
            setReport({ ...report, reported_user_id: e.target.value })
          }
        />
        <Input
          fullWidth
          label="Reason"
          value={report.reason}
          onChange={(e) => setReport({ ...report, reason: e.target.value })}
        />
        <Textarea
          fullWidth
          label="Description"
          value={report.description}
          onChange={(e) =>
            setReport({ ...report, description: e.target.value })
          }
        />
      </CardBody>
      <CardFooter>
        <Button onClick={submitReport}>Submit Report</Button>
      </CardFooter>
    </Card>
  );
};

export default ReportForm;
