/**
 * 格式化日期范围显示
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @returns {string|null} 格式化后的日期范围字符串
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (startDate && endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  } else if (startDate) {
    return `从 ${formatDate(startDate)}`;
  } else if (endDate) {
    return `至 ${formatDate(endDate)}`;
  }
  return null;
};

/**
 * 检查日期是否为今天之前
 * @param {string|Date} date 要检查的日期
 * @returns {boolean} 是否为过去的日期
 */
export const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

/**
 * 检查日期是否为未来日期
 * @param {string|Date} date 要检查的日期
 * @returns {boolean} 是否为未来的日期
 */
export const isFutureDate = (date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const checkDate = new Date(date);
  return checkDate > today;
};

/**
 * 获取两个日期之间的天数
 * @param {string|Date} startDate 开始日期
 * @param {string|Date} endDate 结束日期
 * @returns {number} 天数
 */
export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}; 