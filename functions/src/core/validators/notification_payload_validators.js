/* eslint-disable */
exports.validateNotificationPayload = (body) => {
  const { fleet_id, job_ids, title, body: msgBody, data } = body;

  if (!fleet_id)
    return "fleet_id is required";

  if (isNaN(Number(fleet_id)))
    return "fleet_id must be a number";

  if (!job_ids)
    return "job_ids is required";

  if (!Array.isArray(job_ids) || job_ids.length === 0)
    return "job_ids must be a non-empty array";

  if (job_ids.some((id) => isNaN(Number(id))))
    return "all job_ids must be numbers";

  if (!title || typeof title !== "string" || !title.trim())
    return "title must be a non-empty string";

  if (!msgBody || typeof msgBody !== "string" || !msgBody.trim())
    return "body must be a non-empty string";

  if (data !== undefined && (typeof data !== "object" || Array.isArray(data)))
    return "data must be a key-value object";

  return null;
}