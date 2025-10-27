import { View } from '@/components/ui'
import React from 'react'
import TabBarButton from './TabBarButton';
import { StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

const TabBar = ({ state, descriptors, navigation }: any) => {
    const activeColor = '#22C55E';
    const inactiveColor = '#9CA3AF';

    return (
        <View style={styles.tabbarContainer}>
            {/* Background */}
            {Platform.OS === 'ios' ? (
                <BlurView 
                    intensity={80} 
                    tint="systemChromeMaterialDark"
                    style={styles.blurBackground}
                />
            ) : (
                <View style={[styles.blurBackground, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]} />
            )}
            
            {/* Border line */}
            <View style={styles.borderLine} />
            
            <View style={styles.tabbar}>
                {state.routes.map((route: any, index: any) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                        ? options.title
                        : route.name;

                    if(['_sitemap', '+not-found'].includes(route.name)) return null;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TabBarButton 
                            key={route.name}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            isFocused={isFocused}
                            routeName={route.name}
                            color={isFocused ? activeColor : inactiveColor}
                            label={label}
                            primaryColor={activeColor}
                        />
                    );
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    tabbarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    blurBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    borderLine: {
        height: 1,
        backgroundColor: '#B7FFDC',
        opacity: 0.1,
        borderRadius: 'full'
    },
    tabbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        minHeight: Platform.select({
            ios: 85,
            android: 70,
            default: 70,
        }),
        paddingBottom: Platform.select({
            ios: 30,
            android: 35,
            default: 35,
        }),
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0, 0, 0, 0.25)',
    },
})

export default TabBar