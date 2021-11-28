// Function to create response
export const createResponse = (message: string, data: any) => ({
  message,
  data,
})

// Function to create the error object
export const createError = (status: number, name: string, message: string) => {
  const e = new Error();
  (<any>e).status = status
  e.name = name
  e.message = message
  return e
}

// Function to calculate the current mileston of the user and list of milestones to achieve.
export const milestones = (totalReferred: number) => {
  const milestoneNames = ['Newbie', 'Pupil', 'Apprentice', 'Specialist', 'Expert', 'Master', 'Grandmaster']
  const requirements = [10, 20, 50, 100, 200, 500]
  const rewards = [100, 500, 2000, 5000, 10000, 20000]
  let level = 0
  for (level = 0; level < 6; level += 1) {
    if (requirements[level] > totalReferred) { break }
  }
  const milestonesToAchieve = milestoneNames.slice(level + 1).map((value, index) => {
    const milestone = {
      milestoneName: value,
      requiredReferrals: requirements[level + index] - totalReferred,
      reward: rewards[level + index],
    }
    return milestone
  })
  const results = {
    totalReferred,
    milestone: milestoneNames[level],
    milestonesToAchieve,
  }
  return results
}

// Function to calculate the points gained by the referee when his referral is used
export const pointsGain = (totalReferred: number) => {
  const requirements = [10, 20, 50, 100, 200, 500]
  const rewards = [100, 500, 2000, 5000, 10000, 20000]
  let score = 0
  let level = 0
  for (level = 0; level < 7; level += 1) {
    if (requirements[level] === totalReferred) {
      score = rewards[level]
    }
  }
  return score
}

// Function to mask the email
export const maskedEmail = (email: string) => {
  const maskid = email.replace(
    /^(.)(.*)(.@.*)$/,
    (_, a, b, c) => a + b.replace(/./g, '*') + c,
  )
  return maskid
}
