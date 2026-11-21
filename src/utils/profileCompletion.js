export function getMissingProfileDetails(user) {
  if (!user) return 0;

  const requiredValues = [
    user.firstName,
    user.lastName,
    user.emailVerified && !user.pendingEmail,
    user.mobile,
    user.alternatePhone,
    user.residentialAddress?.street,
    user.residentialAddress?.suburb,
    user.residentialAddress?.city,
    user.residentialAddress?.province,
    user.residentialAddress?.postalCode
  ];

  if (!user.postalSameAsResidential) {
    requiredValues.push(
      user.postalAddress?.street,
      user.postalAddress?.suburb,
      user.postalAddress?.city,
      user.postalAddress?.province,
      user.postalAddress?.postalCode
    );
  }

  return requiredValues.filter((value) => value === false || value == null || (typeof value === 'string' && !value.trim())).length;
}
