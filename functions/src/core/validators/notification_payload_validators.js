/* eslint-disable */
exports.validateNotificationPayload = (body) => {
  const { fleet_id, task_ids, title, body: msgBody, data } = body;

  if (!fleet_id)
    return "fleet_id is required";

  if (isNaN(Number(fleet_id)))
    return "fleet_id must be a number";

  if (!task_ids)
    return "task_ids is required";

  if (!Array.isArray(task_ids) || task_ids.length === 0)
    return "task_ids must be a non-empty array";

  if (task_ids.some((id) => isNaN(Number(id))))
    return "all task_ids must be numbers";

  if (!title || typeof title !== "string" || !title.trim())
    return "title must be a non-empty string";

  if (!msgBody || typeof msgBody !== "string" || !msgBody.trim())
    return "body must be a non-empty string";

  if (data !== undefined && (typeof data !== "object" || Array.isArray(data)))
    return "data must be a key-value object";

  return null;
}