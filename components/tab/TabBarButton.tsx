import { Pressable, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import { icons } from '@/assets/icons';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Fallback icon component in case the icon is not found
const FallbackIcon = ({ color }: { color: string }) => (
  <IconSymbol size={22} name="questionmark.circle" color={color} />
);

const TabBarButton = (props: { 
    isFocused: boolean; 
    label: string; 
    routeName: string; // Changed from keyof typeof icons to string
    color: string; 
    onPress?: () => void;
    onLongPress?: () => void;
}) => {
    const {isFocused, label, routeName, color, onPress, onLongPress} = props;

    const scale = useSharedValue(0);

    useEffect(()=>{
        scale.value = withSpring(
            isFocused ? 1 : 0,
            {duration: 350}
        );
    },[scale, isFocused]);

    // Get the icon component or use fallback
    const IconComponent = icons[routeName as keyof typeof icons] || FallbackIcon;

    const animatedIconStyle = useAnimatedStyle(()=>{
        const scaleValue = interpolate(
            scale.value,
            [0, 1],
            [1, 1.2]
        );
        const top = interpolate(
            scale.value,
            [0, 1],
            [0, 4]
        );

        return {
            transform: [{scale: scaleValue}],
            top
        }
    });

    const animatedTextStyle = useAnimatedStyle(()=>{
        const opacity = interpolate(
            scale.value,
            [0, 1],
            [1, 0]
        );

        return {
            opacity
        }
    });

    return (
        <Pressable 
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.container}
        >
            <Animated.View style={[animatedIconStyle]}>
                <IconComponent color={color} />
            </Animated.View>
            
            <Animated.Text style={[{ 
                color,
                fontSize: 11,
                marginTop: 2
            }, animatedTextStyle]}>
                {label}
            </Animated.Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 8
    }
})

export default TabBarButton