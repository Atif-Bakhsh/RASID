import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { LedgerDialog } from './ui';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        افتح النموذج
      </button>
      {open && (
        <LedgerDialog
          title="نموذج تجريبي"
          closeLabel="إغلاق"
          onClose={() => setOpen(false)}
        >
          <label>
            الاسم
            <input />
          </label>
          <button type="button">آخر إجراء</button>
        </LedgerDialog>
      )}
    </>
  );
}

describe('LedgerDialog', () => {
  it('moves focus inside, traps tabbing and restores focus after Escape', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'افتح النموذج' });
    await user.click(opener);
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('textbox', { name: 'الاسم' })).toHaveFocus();

    dialog.getByRole('button', { name: 'آخر إجراء' }).focus();
    await user.tab();
    expect(dialog.getByRole('button', { name: 'إغلاق' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
