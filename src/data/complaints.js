export const complaintCategories = [
  { value: 'payment', label: 'Payment or fees' },
  { value: 'performance', label: 'Delivery or performance' },
  { value: 'scope', label: 'Scope or interpretation' },
  { value: 'communication', label: 'Communication' },
  { value: 'confidentiality', label: 'Confidentiality or information' },
  { value: 'other', label: 'Other contract concern' }
];

export const complaintStatuses = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'awaiting_response', label: 'Awaiting response' },
  { value: 'under_review', label: 'Platform review' },
  { value: 'referred', label: 'External support recommended' },
  { value: 'closed', label: 'Closed in platform' }
];

export const complaintStatusLabel = (status) => complaintStatuses.find((item) => item.value === status)?.label || status;
export const complaintCategoryLabel = (category) => complaintCategories.find((item) => item.value === category)?.label || category;
