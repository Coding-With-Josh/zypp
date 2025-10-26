import { Input, Text, View } from '@/components/ui'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { router } from 'expo-router'
import React, { useState, useEffect, useRef } from 'react'
import { Image, TouchableOpacity, Alert, Animated } from 'react-native'

const SetPin = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [pin, setPin] = useState("")
    const [confirmPin, setConfirmPin] = useState("")
    const [step, setStep] = useState<'enter' | 'confirm'>('enter')
    const inputRef = useRef<{ focus: () => void }>(null)
    const shakeAnimation = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [step])

    const handlePinChange = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4)
        if (step === 'enter') {
            setPin(numericValue)
            if (numericValue.length === 4) {
                setTimeout(() => setStep('confirm'), 300)
            }
        } else {
            setConfirmPin(numericValue)
            // Check if PINs match after state update
            // if (numericValue.length === 4) {
            //     setTimeout(() => {
            //         if (pin === numericValue) {
            //             handleSave()
            //         }
            //     }, 0)
            // }
        }
    }

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start()
    }

    const handleSave = async () => {
        if (pin.length !== 4) {
            Alert.alert('Invalid PIN', 'PIN must be 4 digits')
            return
        }

        if (step === 'enter') {
            setStep('confirm')
            return
        }

        // Use the current state values
        if (pin !== confirmPin) {
            Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.')
            setConfirmPin('')
            triggerShake()
            if (inputRef.current) {
                inputRef.current.focus()
            }
            return
        }

        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            router.replace('/home')
        } catch (_error) {
            Alert.alert('Error', 'Failed to save PIN')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('enter')
            setConfirmPin('')
        }
    }

    const renderPinDots = () => {
        const currentPin = step === 'enter' ? pin : confirmPin
        return (
            <View className="flex-row justify-center items-center gap-6 mb-8">
                {[0, 1, 2, 3].map((index) => (
                    <View
                        key={index}
                        className={`w-6 h-6 rounded-full border-3 transition-all duration-200 ${
                            index < currentPin.length 
                                ? 'bg-primary border-primary scale-110' 
                                : 'border-white/30'
                        }`}
                    />
                ))}
            </View>
        )
    }

    const canProceed = step === 'enter' ? pin.length === 4 : confirmPin.length === 4

    return (
        <View className="flex-1 pb-28 justify-end items-start bg-black relative">
            <Image
                source={require('@/assets/images/design/top-gradient.png')}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 500 }}
                resizeMode="cover"
            />

            <View className="flex flex-col items-start justify-center w-full px-5 gap-9">
                {/* Header with back button */}
                <View className="w-full">
                    {step === 'confirm' && (
                        <TouchableOpacity
                            onPress={handleBack}
                            className="flex-row items-center gap-2 mb-4 active:opacity-70"
                        >
                            <IconSymbol name="chevron.left" color="white" size={24} />
                            <Text className="text-white text-lg font-semibold">Back</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Title Section */}
                <View className="gap-3 w-full">
                    <Text className="text-white font-semibold tracking-[-0.9] text-5xl">
                        {step === 'enter' ? 'Set ' : 'Confirm '}
                        <Text className="text-primary font-semibold tracking-[-0.9] text-5xl">PIN</Text>
                    </Text>
                    <Text className="text-white/80 font-medium tracking-[-0.2] text-lg leading-6">
                        {step === 'enter'
                            ? 'Enter a 4-digit PIN to secure your transactions'
                            : 'Please confirm your PIN to continue'}
                    </Text>
                </View>

                {/* Visual PIN Indicator */}
                {renderPinDots()}

                {/* Hidden Input */}
                <Animated.View
                    style={{ transform: [{ translateX: shakeAnimation }] }}
                    className="w-full opacity-0 absolute"
                >
                    <Input
                        ref={inputRef}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                        value={step === 'enter' ? pin : confirmPin}
                        onChangeText={handlePinChange}
                        autoFocus
                        selectTextOnFocus
                    />
                </Animated.View>

                {/* Number Pad */}
                <View className="w-full">
                    <View className="flex-row flex-wrap justify-between gap-4 mb-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                className="w-28 h-16 items-center justify-center active:bg-white/10 rounded-2xl border border-white/10"
                                onPress={() => {
                                    const currentValue = step === 'enter' ? pin : confirmPin
                                    const newValue = currentValue + num
                                    if (newValue.length <= 4) {
                                        handlePinChange(newValue)
                                    }
                                }}
                            >
                                <Text className="text-white text-2xl font-semibold">{num}</Text>
                            </TouchableOpacity>
                        ))}
                        <View className="w-28 h-16" /> {/* Spacer */}
                        <TouchableOpacity
                            className="w-28 h-16 items-center justify-center active:bg-white/10 rounded-2xl border border-white/10"
                            onPress={() => {
                                const currentValue = step === 'enter' ? pin : confirmPin
                                const newValue = currentValue + '0'
                                if (newValue.length <= 4) {
                                    handlePinChange(newValue)
                                }
                            }}
                        >
                            <Text className="text-white text-2xl font-bold">0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-28 h-16 items-center justify-center active:bg-red-500/20 rounded-2xl border border-white/10"
                            onPress={() => {
                                const currentValue = step === 'enter' ? pin : confirmPin
                                handlePinChange(currentValue.slice(0, -1))
                            }}
                            disabled={(step === 'enter' ? pin : confirmPin).length === 0}
                        >
                            <IconSymbol name="delete.left" color="white" size={28} />
                        </TouchableOpacity>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        className={`h-14 rounded-full flex flex-row items-center justify-center gap-3
                                  transition-all duration-200 active:scale-95
                                  ${isLoading || !canProceed ? 'opacity-50' : 'opacity-100'} 
                                  bg-primary w-full`}
                        onPress={handleSave}
                        disabled={isLoading || !canProceed}
                    >
                        <Text className="text-primary-foreground font-semibold tracking-tighter text-xl">
                            {isLoading ? 'Saving...' : step === 'enter' ? 'Continue' : 'Confirm PIN'}
                        </Text>
                        <IconSymbol
                            name={isLoading ? "arrow.clockwise" : (step === 'enter' ? "arrow.right" : "checkmark")}
                            color="#081405"
                            size={20}
                            weight="bold"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

export default SetPin