
// src/pages/settings/Profile.jsx

import React from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Heading } from '../../components/common/Typography'
import toast from 'react-hot-toast'

export const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      department: user?.department || '',
      year_of_study: user?.year_of_study || '',
      college: user?.college || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    }
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      await updateProfile(data)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error.message || 'Update failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <Heading level={2}>Profile Settings</Heading>
        <p className="text-gray-500 mt-1">Update your personal information</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              {...register('full_name', { required: 'Full name is required' })}
              error={errors.full_name?.message}
            />
            <Input
              label="Email"
              value={user?.email}
              disabled
              className="bg-gray-100"
            />
            <Input
              label="Department"
              {...register('department')}
              error={errors.department?.message}
            />
            <Input
              label="Year of Study"
              type="number"
              {...register('year_of_study')}
              error={errors.year_of_study?.message}
            />
            <Input
              label="College"
              {...register('college')}
              error={errors.college?.message}
            />
            <Input
              label="Phone"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              {...register('bio')}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}