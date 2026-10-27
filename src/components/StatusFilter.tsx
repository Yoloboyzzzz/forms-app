import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import { FORM_STATUSES, type FormStatus } from '@/types/enums';
import { Button, Row } from './primitives';

export type StatusFilterValue = FormStatus | 'all';

const OPTIONS: StatusFilterValue[] = ['all', ...FORM_STATUSES];

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

/** Row of buttons to show all forms or only one status. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const { t } = useTranslation();

  return (
    <Row gap="sm" wrap>
      {OPTIONS.map((option) => (
        <Button
          key={option}
          label={t(`forms.filter.${option}`)}
          variant={option === value ? 'primary' : 'secondary'}
          onPress={() => onChange(option)}
          testID={testIdFor.formStatusFilter(option)}
        />
      ))}
    </Row>
  );
}
