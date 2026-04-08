/**
 * AnimatedNumber - 数字计数动画组件
 * 数据变化时显示计数动画效果
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import './AnimatedNumber.css';

interface AnimatedNumberProps {
  /** 数值 */
  value: number;
  /** 动画时长(ms) */
  duration?: number;
  /** 前缀 */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 是否启用动画 */
  animate?: boolean;
  /** 格式化函数 */
  formatter?: (val: number) => string;
  /** 字体大小 */
  fontSize?: string;
  /** 字体颜色 */
  color?: string;
  /** 字体粗细 */
  fontWeight?: string | number;
  /** 类名 */
  className?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  animate = true,
  formatter,
  fontSize,
  color,
  fontWeight,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);

  // 缓动函数 - easeOutCubic
  const easeOutCubic = (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
  };

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateValue);
      } else {
        previousValue.current = endValue;
        animationRef.current = null;
      }
    };

    // 启动动画
    animationRef.current = requestAnimationFrame(animateValue);

    // 清理
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, animate]);

  // 格式化显示值
  const formattedValue = useMemo(() => {
    if (formatter) {
      return formatter(displayValue);
    }
    return displayValue.toLocaleString();
  }, [displayValue, formatter]);

  return (
    <span
      className={`animated-number ${className}`}
      style={{ fontSize, color, fontWeight }}
      data-value={value}
    >
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default AnimatedNumber;