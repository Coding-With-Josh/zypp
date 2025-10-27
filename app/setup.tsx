import { Text, View } from '@/components/ui'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { router } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { Image, Animated, Easing } from 'react-native'

const SettingUpScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(0.8)).current
    const progressAnim = useRef(new Animated.Value(0)).current
    const pulseAnim = useRef(new Animated.Value(1)).current

    useEffect(() => {
        // Start all animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 3500,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: false,
            }),
        ]).start()

        // Pulse animation for the checkmark
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start()

        // Simulate setup process and navigate
        const timer = setTimeout(() => {
            router.replace('/home')
        }, 10000)

        return () => clearTimeout(timer)
    }, [])

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    })

    const steps = [
        { id: 1, text: 'Setting up your profile', completed: true },
        { id: 2, text: 'Securing your wallet', completed: true },
        { id: 3, text: 'Setting up encryption', completed: true },
        { id: 4, text: 'Creating backup keys', completed: false },
    ]

    return (
        <View className="flex-1 justify-end items-start bg-black relative pb-28">
            <Image
                source={require('@/assets/images/design/top-gradient.png')}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 500 }}
                resizeMode="cover"
            />

            {/* <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'none',
                }}
            >
                <Image
                    source={require('@/assets/images/brand/logo-text.png')}
                    style={{ width: 240, height: 72, opacity: 0.3 }}
                    resizeMode="contain"
                />
            </View> */}

            <Animated.View 
                style={{ 
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }] 
                }}
                className="flex flex-col items-start justify-center w-full px-5 gap-9"
            >
                {/* Main Content */}
                <View className="gap-6 w-full">
                    {/* Animated Icon */}
                    <View className="items-center justify-center mb-4">
                        <Animated.View 
                            style={{ transform: [{ scale: pulseAnim }] }}
                            className="w-24 h-24 bg-primary/20 rounded-3xl items-center justify-center border-2 border-primary/30"
                        >
                            <IconSymbol 
                                name="checkmark.shield" 
                                color="#22C55E" 
                                size={40} 
                                weight="bold" 
                            />
                        </Animated.View>
                    </View>

                    {/* Title */}
                    <View className="gap-3">
                        <Text className="text-white font-semibold tracking-[-0.9] text-5xl text-center w-full">
                            Setting <Text className="text-primary font-semibold tracking-[-0.9] text-5xl">Up</Text>
                        </Text>
                        <Text className="text-white/80 font-medium tracking-[-0.2] text-lg text-center leading-7">
                            We&apos;re getting everything ready for you
                        </Text>
                    </View>

                    {/* Progress Steps */}
                    <View className="gap-5 mt-4">
                        {steps.map((step, index) => (
                            <View key={step.id} className="flex-row items-center gap-4">
                                <Animated.View 
                                    className={`w-6 h-6 rounded-full items-center justify-center border-2 
                                        ${step.completed 
                                            ? 'bg-primary border-primary' 
                                            : 'border-white/30'
                                        }`}
                                >
                                    {step.completed && (
                                        <IconSymbol name="checkmark" color="#081405" size={12} weight="bold" />
                                    )}
                                </Animated.View>
                                <Text className={`text-lg font-medium flex-1 ${
                                    step.completed ? 'text-white' : 'text-white/50'
                                }`}>
                                    {step.text}
                                </Text>
                                {!step.completed && (
                                    <Animated.View 
                                        style={{ transform: [{ scale: pulseAnim }] }}
                                        className="w-2 h-2 bg-primary rounded-full"
                                    />
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Progress Bar */}
                    <View className="gap-3 mt-6">
                        <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <Animated.View 
                                style={{ width: progressWidth }}
                                className="h-full bg-primary rounded-full"
                            />
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-white/60 text-sm">Setting up your account...</Text>
                            <Animated.Text 
                                style={{ 
                                    opacity: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.6, 1]
                                    }) 
                                }}
                                className="text-primary text-sm font-medium"
                            >
                                {progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                })}
                            </Animated.Text>
                        </View>
                    </View>
                </View>

                {/* Loading Indicator */}
                <View className="items-center justify-center w-full mt-8">
                    <View className="flex-row items-center gap-3">
                        <Animated.View 
                            style={{ 
                                opacity: pulseAnim.interpolate({
                                    inputRange: [1, 1.1],
                                    outputRange: [0.6, 1]
                                }) 
                            }}
                        >
                            <IconSymbol name="sparkles" color="#22C55E" size={20} />
                        </Animated.View>
                        <Text className="text-white/60 text-base">Almost ready...</Text>
                    </View>
                </View>
            </Animated.View>
        </View>
    )
}

export default SettingUpScreen