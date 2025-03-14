import React, { useState } from 'react'
import Step1CourseBasicInfo from '../../../../components/user/tutor/myCourses/courseUpload/Step1CourseBasicInfo'
import Step2CourseObjectives from '../../../../components/user/tutor/myCourses/courseUpload/Step2CourseObjectives'
import Step3CourseContent from '../../../../components/user/tutor/myCourses/courseUpload/Step3CourseContent'
import Step4CoursePreview from '../../../../components/user/tutor/myCourses/courseUpload/Step4CoursePreview'

const CreateCourse = () => {
    const [step, setStep] = useState(1)

    return (
        <div>
            {
                step == 1 ?(
                    <Step1CourseBasicInfo setStep={setStep} />
                ): step === 2 ?(
                    <Step2CourseObjectives setStep={setStep} />
                ): step === 3 ?(
                    <Step3CourseContent setStep={setStep} />
                ): (
                    <Step4CoursePreview setStep={setStep} />
                )
            }
        </div>
    )
}

export default CreateCourse