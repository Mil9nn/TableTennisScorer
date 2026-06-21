import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const sizeClasses = {
    sm: 'py-2 px-4 min-h-[32px]',
    md: 'py-3 px-5 min-h-[40px]',
    lg: 'py-4 px-6 min-h-[48px]',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        className={cn(
          'rounded-lg items-center justify-center overflow-hidden',
          sizeClasses[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-50'
        )}
        style={style}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className={cn('w-full items-center justify-center', sizeClasses[size])}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className={cn('text-white font-semibold', textSizeClasses[size])} style={textStyle}>
              {children}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantClasses = {
    secondary: 'bg-gray-50 border border-gray-200',
    outline: 'bg-transparent border-1.5 border-blue-600',
    ghost: 'bg-transparent',
  };

  const variantTextClasses = {
    secondary: 'text-gray-800',
    outline: 'text-blue-600',
    ghost: 'text-gray-800',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'rounded-lg items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50'
      )}
      style={style}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#3b82f6' : '#fff'}
          size="small"
        />
      ) : (
        <Text className={cn('font-semibold', variantTextClasses[variant], textSizeClasses[size])} style={textStyle}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};


