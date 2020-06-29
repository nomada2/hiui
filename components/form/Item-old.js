import React, { Component, useContext, useState, useEffect } from 'react'
import classNames from 'classnames'
import AsyncValidator from 'async-validator'
import PropTypes from 'prop-types'
import { depreactedPropsCompat } from '../_util'
import { FormContext } from './Form'
/**
 * rules 中 如果trigger 不传入 则 在最后点击时候时候校验规则
 *
 */

class FormItem1 extends Component {
  constructor (props, context) {
    super(props)
    const { formProps, removeField, addField } = props
    this.state = {
      error: '',
      valid: false,
      validating: false
    }

    this.initValue = ''

    this.parent = {
      props: formProps,
      removeField,
      addField
    }
  }

  componentDidMount () {
    const { field } = this.props
    if (field) {
      this.parent.addField(this)
      this.valueInit()
    }
  }

  componentWillUnmount () {
    this.parent.removeField(this.props.field)
  }

  valueInit () {
    const value = this.parent.props.model[this.props.field]
    if (value === undefined) {
      this.initValue = value
    } else {
      this.initValue = JSON.parse(JSON.stringify(value))
    }
  }

  getRules () {
    const selfRules = this.props.rules
    let formRules = this.parent.props.rules

    formRules = formRules ? formRules[this.props.field] : []
    return [].concat(selfRules || formRules || [])
  }

  getFilteredRule (trigger) {
    const rules = this.getRules()
    return rules.filter(rule => {
      return !rule.trigger || rule.trigger.indexOf(trigger) !== -1
    })
  }

  getfieldValue () {
    const model = this.parent.props.model
    if (!model || !this.props.field) {
      return
    }

    const keyList = this.props.field.split(':')
    return keyList.length > 1
      ? model[keyList[0]][keyList[1]]
      : model[this.props.field]
  }

  validate (trigger, cb) {
    const rules = this.getFilteredRule(trigger)
    if (!rules || rules.length === 0) {
      if (cb instanceof Function) {
        cb()
      }

      return true
    }

    this.setState({
      validating: true
    })
    const { field } = this.props
    const validator = new AsyncValidator({
      [field]: rules
    })
    const model = { [field]: this.getfieldValue() }
    validator.validate(
      model,
      {
        firstFields: true
      },
      errors => {
        this.setState(
          {
            error: errors ? errors[0].message : '',
            validating: false,
            valid: !errors
          },
          () => {
            if (cb instanceof Function) {
              cb(errors)
            }
          }
        )
      }
    )
  }

  resetValidate () {
    this.setState({
      error: '',
      valid: true
    })
  }

  isRequired () {
    let rules = this.getRules()
    let isRequired = false

    if (rules && rules.length) {
      rules.every(rule => {
        if (rule.required) {
          isRequired = true
          return false
        }
        return true
      })
    }
    return isRequired
  }

  handleFieldBlur () {
    const hasOnChange = this.getRules().some(rule => {
      const { trigger = '' } = rule
      return trigger.includes('onBlur')
    })

    if (hasOnChange) {
      this.validate('onBlur')
    }
  }

  handleFieldChange (value) {
    const hasOnChange = this.getRules().some(rule => {
      const { trigger = '' } = rule
      return trigger.includes('onChange')
    })

    if (hasOnChange) {
      this.validate('onChange')
    }
  }

  get labelWidth () {
    const labelWidth = this.props.labelWidth || this.parent.props.labelWidth

    return this.parent.props.labelPosition === 'top'
      ? false
      : labelWidth && parseInt(labelWidth)
  }

  render () {
    console.log('this.parent', this.parent)
    const {
      children,
      label,
      required,
      className,
      showColon: shouldItemShowColon,
      style
    } = this.props
    const {
      showColon: shouldFormShowColon,
      localeDatas: {
        form: { colon }
      }
    } = this.parent.props || {}
    const { error, validating } = this.state
    const shouldShowColon =
      shouldItemShowColon === undefined
        ? shouldFormShowColon && typeof label === 'string' && label.trim()
        : shouldItemShowColon
    const obj = {}
    obj['hi-form-item__error'] = error !== ''
    obj['hi-form-item--validating'] = validating
    obj['hi-form-item--required'] = this.isRequired() || required

    return (
      <div className={classNames('hi-form-item', className, obj)} style={style}>
        {label || label === '' ? (
          <label
            className='hi-form-item__label'
            style={{ width: this.labelWidth }}
          >
            {(typeof label === 'string' && label.trim()) || label}
            {shouldShowColon && colon}
          </label>
        ) : (
          <span
            className='hi-form-item__span'
            style={{ width: this.labelWidth }}
          />
        )}
        <div className={'hi-form-item' + '__content'}>
          {Array.isArray(children) || !children
            ? children
            : React.cloneElement(children, {
              onChange: e => {
                children.props.onChange && children.props.onChange(...args)
                setTimeout(() => {
                  this.handleFieldChange(e.target.value)
                })
              },
              onBlur: (...args) => {
                children.props.onBlur && children.props.onBlur(...args)
                setTimeout(() => {
                  this.handleFieldBlur()
                })
              }
            })}
          <div className='hi-form-item--msg__error'>{error}</div>
        </div>
      </div>
    )
  }
}

FormItem1.propTypes = {
  field: PropTypes.string,
  rules: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  required: PropTypes.bool,
  label: PropTypes.string,
  labelWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showColon: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object
}

FormItem1.defaultProps = {
  size: 'small'
}

export default depreactedPropsCompat([['field', 'prop']])(FormItem)