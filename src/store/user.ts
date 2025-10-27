import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const loginUser = ref({
    userName: '未登录',
  })
  async function fetchLoginUser() {

  }
  async function fetchLogoutUser() {

  }
  return { loginUser, fetchLoginUser,fetchLogoutUser }
})
