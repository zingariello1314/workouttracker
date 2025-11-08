export async function handleSubmitSession({
  activityType,
  payload,
  resetFn,
  ui,
  addSession,
  updateSession,
  setUI
}) {
  const isEditing = ui?.editingSession && ui.editingSession.activityType === activityType;

  if (isEditing) {
    const result = await updateSession(
      ui.editingSession.activityType,
      ui.editingSession.sessionId,
      payload
    );

    if (result?.success) {
      resetFn?.();
    }

    return result;
  }

  const result = await addSession(activityType, payload);
  if (result?.success) {
    resetFn?.();
    setUI?.({ showSessionForm: false });
  }
  return result;
}
