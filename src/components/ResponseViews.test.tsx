import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor, testIds } from '@/constants/testIds';
import { makeQuestion } from '@/testUtils/factories';
import type { Profile, ResponseAnswer, ResponseRow, Submission } from '@/types/models';
import { ResponseList } from './ResponseList';
import { ResponseSummary } from './ResponseSummary';
import { SubmissionDetail } from './SubmissionDetail';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

function user(id: string, fullName: string): Profile {
  return { id, fullName, email: `${id}@b.c`, role: 'user', mustChangePassword: false, createdAt: new Date(0), updatedAt: new Date(0) };
}

function row(id: string, fullName: string, status?: Submission['status']): ResponseRow {
  return {
    assignment: { id, formId: 'f1', userId: `u-${id}`, assignedBy: 'admin', assignedAt: new Date(0) },
    user: user(`u-${id}`, fullName),
    submission:
      status === undefined
        ? undefined
        : {
            id: `s-${id}`,
            assignmentId: id,
            status,
            submittedAt: status === 'submitted' ? new Date(2026, 10, 4, 14, 30) : undefined,
            createdAt: new Date(0),
            updatedAt: new Date(0),
          },
  };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('ResponseList', () => {
  const rows = [row('a1', 'Ann', 'submitted'), row('a2', 'Bob', 'draft'), row('a3', 'Cleo')];

  it('shows each person with their status', () => {
    render(<ResponseList rows={rows} onOpen={jest.fn()} />);
    expect(screen.getByText('Submitted')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByText('Not started')).toBeTruthy();
    expect(screen.getByText('Submitted on Nov 4, 2026, 2:30 PM')).toBeTruthy();
  });

  it('opens a response, but not for someone who has not started', () => {
    const onOpen = jest.fn();
    render(<ResponseList rows={rows} onOpen={onOpen} />);
    fireEvent.press(screen.getByTestId(testIdFor.responseRow('a1')));
    fireEvent.press(screen.getByTestId(testIdFor.responseRow('a3')));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(rows[0]);
  });

  it('falls back to the email when a name is missing', () => {
    render(<ResponseList rows={[row('a1', '', 'draft')]} onOpen={jest.fn()} />);
    expect(screen.getAllByText('u-a1@b.c').length).toBeGreaterThan(0);
  });
});

describe('ResponseSummary', () => {
  const options = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
  ];
  const questions = [
    makeQuestion('mc', { title: 'Pick', questionType: 'multiple_choice', options, settings: {} }),
    makeQuestion('ls', { title: 'Rate', questionType: 'linear_scale', settings: { min: 1, max: 3 } }),
    makeQuestion('tx', { title: 'Comments' }),
    makeQuestion('rt', { title: 'Stars', questionType: 'rating', settings: {} }),
  ];
  const answers: ResponseAnswer[] = [
    { submissionId: 's1', questionId: 'mc', value: { optionId: 'a' } },
    { submissionId: 's2', questionId: 'mc', value: { optionId: 'a' } },
    { submissionId: 's3', questionId: 'mc', value: { other: 'Gamma' } },
    { submissionId: 's1', questionId: 'ls', value: 3 },
    { submissionId: 's2', questionId: 'ls', value: 2 },
    { submissionId: 's1', questionId: 'tx', value: 'Great form' },
  ];

  it('shows counts and percentages for choices, and what people typed for other', () => {
    render(<ResponseSummary questions={questions} answers={answers} />);
    const summary = screen.getByTestId(testIdFor.summary('mc'));
    expect(summary).toHaveTextContent(/Alpha2 \(67%\)/);
    expect(summary).toHaveTextContent(/Beta0 \(0%\)/);
    expect(summary).toHaveTextContent(/Gamma/);
    expect(summary).toHaveTextContent(/3 answers/);
  });

  it('shows the average and distribution of a scale', () => {
    render(<ResponseSummary questions={questions} answers={answers} />);
    const summary = screen.getByTestId(testIdFor.summary('ls'));
    expect(summary).toHaveTextContent(/Average: 2\.5/);
    expect(summary).toHaveTextContent(/21 \(50%\)/);
  });

  it('lists text answers', () => {
    render(<ResponseSummary questions={questions} answers={answers} />);
    expect(screen.getByTestId(testIdFor.summary('tx'))).toHaveTextContent(/Great form/);
  });

  it('shows ratings with an average, and says there is no summary for types without one yet', () => {
    const upload = makeQuestion('up', { title: 'File', questionType: 'file_upload', settings: {} });
    render(<ResponseSummary questions={[questions[3], upload]} answers={[{ submissionId: 's1', questionId: 'rt', value: 4 }]} />);
    expect(screen.getByTestId(testIdFor.summary('rt'))).toHaveTextContent(/Average: 4\.0/);
    expect(screen.getByTestId(testIdFor.summary('up'))).toHaveTextContent(/No summary for this question type yet\./);
  });

  it('shows zero answers without breaking', () => {
    render(<ResponseSummary questions={questions.slice(0, 2)} answers={[]} />);
    expect(screen.getByTestId(testIds.responses.summary)).toHaveTextContent(/0 answers/);
  });
});

describe('SubmissionDetail', () => {
  const options = [{ id: 'a', label: 'Alpha' }];
  const questions = [
    makeQuestion('mc', { title: 'Pick', questionType: 'multiple_choice', options, settings: {} }),
    makeQuestion('tx', { title: 'Comments' }),
    makeQuestion('old', { title: 'Old question', isActive: false }),
  ];

  it('shows the person, status, date and every answer', () => {
    render(
      <SubmissionDetail row={row('a1', 'Ann', 'submitted')} questions={questions} answers={{ mc: { optionId: 'a' }, tx: 'Hello' }} />,
    );
    expect(screen.getByText('Response of Ann')).toBeTruthy();
    expect(screen.getByText('Submitted')).toBeTruthy();
    expect(screen.getByText('Submitted on Nov 4, 2026, 2:30 PM')).toBeTruthy();
    expect(screen.getByTestId(testIdFor.detailAnswer('mc'))).toHaveTextContent(/Alpha/);
    expect(screen.getByTestId(testIdFor.detailAnswer('tx'))).toHaveTextContent(/Hello/);
  });

  it('says when a question was not answered, and marks deactivated questions', () => {
    render(<SubmissionDetail row={row('a1', 'Ann', 'submitted')} questions={questions} answers={{}} />);
    expect(screen.getByTestId(testIdFor.detailAnswer('tx'))).toHaveTextContent(/No answer/);
    expect(screen.getByTestId(testIdFor.detailAnswer('old'))).toHaveTextContent(/\(deactivated question\)/);
  });

  it('shows a draft without a submission date', () => {
    render(<SubmissionDetail row={row('a1', 'Ann', 'draft')} questions={questions} answers={{}} />);
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.queryByText(/Submitted on/)).toBeNull();
  });

  it('uses the email when the name is missing, and treats a row without response as a draft', () => {
    render(<SubmissionDetail row={row('a1', '')} questions={[]} answers={{}} />);
    expect(screen.getByText('Response of u-a1@b.c')).toBeTruthy();
  });
});
