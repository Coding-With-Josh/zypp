import { KeyboardAvoidingView, SafeAreaView } from '@/components/ui'
import React from 'react'
const Me = () => {
  return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-black">
      <KeyboardAvoidingView className="flex-1">
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Me